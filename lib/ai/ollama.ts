import {
  continuationSchema,
  correctionResultSchema,
  generatedFlashcardBatchSchema,
  generatedFlashcardSchema,
  generatedQuizSchema,
} from "./schema";
import type { GeneratedFlashcard } from "./schema";
import {
  buildContinuationPrompt,
  buildCorrectionPrompt,
  buildFlashcardBatchPrompt,
  buildFlashcardPrompt,
  buildQuizPrompt,
  stripFences,
} from "./prompts";
import type {
  AiProvider,
  CorrectTextInput,
  GenerateFlashcardInput,
  GenerateQuizInput,
  SuggestContinuationInput,
} from "./provider";

const BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const MODEL = process.env.OLLAMA_MODEL || "translategemma:12b";

/**
 * Keep the model resident between requests. Ollama unloads after 5 minutes
 * idle by default, and reloading a 12B model from disk costs several seconds
 * that land on whichever user happens to submit first after a lull.
 */
const KEEP_ALIVE = "30m";

/**
 * Ceilings on generated tokens. Generation is the slowest part of a request,
 * so an unbounded response is an unbounded wait; these are set well above
 * what a well-behaved answer needs and exist only to cap the worst case.
 */
const MAX_TOKENS_TEXT = 1024;
const MAX_TOKENS_JSON = 2048;

/**
 * Ollama has no built-in auth. When it's reached through a public tunnel
 * (ngrok, Cloudflare Tunnel) rather than plain localhost, set
 * OLLAMA_AUTH_HEADER to the exact `Authorization` header value the tunnel
 * expects (e.g. "Basic <base64 user:pass>") so requests aren't rejected —
 * and so the tunnel isn't left open to anyone who finds the URL.
 */
function ollamaHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    // Harmless outside ngrok; required to skip ngrok's free-tier HTML
    // interstitial page, which would otherwise return HTML instead of JSON.
    "ngrok-skip-browser-warning": "true",
  };
  if (process.env.OLLAMA_AUTH_HEADER) {
    headers.Authorization = process.env.OLLAMA_AUTH_HEADER;
  }
  return headers;
}

/** One-shot, non-streaming chat call constrained to JSON output via Ollama's `format: "json"`. */
export async function ollamaChatJson(
  prompt: string,
  temperature: number,
  signal?: AbortSignal,
): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/chat`, {
    method: "POST",
    headers: ollamaHeaders(),
    signal,
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      stream: false,
      format: "json",
      // Suppress any chain-of-thought pass: it adds real latency and isn't
      // needed for structured extraction/correction — the prompt already
      // spells out the exact rules to apply. Accepted (and ignored) by
      // models that have no reasoning mode.
      think: false,
      keep_alive: KEEP_ALIVE,
      options: { temperature, num_predict: MAX_TOKENS_JSON },
    }),
  });
  if (!res.ok) {
    throw new Error(
      `Ollama request failed (${res.status}): ${await res.text()}`,
    );
  }
  const data = (await res.json()) as { message?: { content?: string } };
  return data.message?.content ?? "";
}

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(stripFences(raw));
  } catch {
    throw new Error("AI returned a non-JSON response");
  }
}

/** Local Ollama server as an AiProvider. */
export function createOllamaProvider(): AiProvider {
  return {
    async correctText(input: CorrectTextInput) {
      const raw = await ollamaChatJson(buildCorrectionPrompt(input), 0.2);
      return correctionResultSchema.parse(parseJson(raw));
    },

    async generateFlashcard(input: GenerateFlashcardInput) {
      const raw = await ollamaChatJson(buildFlashcardPrompt(input), 0.3);
      return generatedFlashcardSchema.parse(parseJson(raw));
    },

    async generateFlashcards(words: string[]) {
      if (words.length === 0) return [];
      const raw = await ollamaChatJson(buildFlashcardBatchPrompt(words), 0.3);
      const batch = generatedFlashcardBatchSchema.parse(parseJson(raw));
      const cards: GeneratedFlashcard[] = [];
      for (const item of batch.cards) {
        const result = generatedFlashcardSchema.safeParse(item);
        if (result.success) cards.push(result.data);
      }
      return cards;
    },

    async generateQuiz(input: GenerateQuizInput) {
      const raw = await ollamaChatJson(buildQuizPrompt(input), 0.4);
      return generatedQuizSchema.parse(parseJson(raw));
    },

    async suggestContinuation(input: SuggestContinuationInput) {
      const raw = await ollamaChatJson(buildContinuationPrompt(input), 0.7);
      return continuationSchema.parse(parseJson(raw));
    },
  };
}

/**
 * Streams plain-text completion chunks from Ollama (no JSON formatting) —
 * used by the translate routes, which stream prose straight to the client.
 * Ollama's streaming wire format is newline-delimited JSON, one object per
 * token/chunk: {"message":{"content":"..."},"done":false}.
 */
export async function* ollamaStreamText(
  prompt: string,
  temperature: number,
  signal?: AbortSignal,
): AsyncGenerator<string> {
  const res = await fetch(`${BASE_URL}/api/chat`, {
    method: "POST",
    headers: ollamaHeaders(),
    // Pass the caller's signal through so that a client disconnect actually
    // stops generation. Without it Ollama keeps producing tokens for a
    // response nobody will read, holding the CPU against the next request.
    signal,
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      stream: true,
      // See ollamaChatJson: skip any reasoning pass so translated text
      // starts streaming immediately instead of after a think block.
      think: false,
      keep_alive: KEEP_ALIVE,
      options: { temperature, num_predict: MAX_TOKENS_TEXT },
    }),
  });
  if (!res.ok || !res.body) {
    throw new Error(
      `Ollama request failed (${res.status}): ${await res.text()}`,
    );
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  function emit(line: string): string | null {
    if (!line.trim()) return null;
    const chunk = JSON.parse(line) as { message?: { content?: string } };
    return chunk.message?.content || null;
  }

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const content = emit(line);
      if (content) yield content;
    }
  }
  const content = emit(buffer);
  if (content) yield content;
}
