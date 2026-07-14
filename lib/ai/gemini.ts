import { GoogleGenAI } from "@google/genai";
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

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";

/** Gemini is temporarily overloaded (503) — safe to retry, usually resolves in seconds. */
export function isAiOverloaded(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /"code":\s*503|UNAVAILABLE/i.test(msg);
}

/**
 * The project has exhausted its Gemini quota (429 RESOURCE_EXHAUSTED — e.g.
 * the free tier's 20 requests/day/model cap). This is NOT transient within
 * the request lifecycle: retrying immediately just spends another unit of
 * the same exhausted quota, so callers must NOT retry this one.
 */
export function isAiQuotaExhausted(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /"code":\s*429|RESOURCE_EXHAUSTED/i.test(msg);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retries a transient AI call before giving up. Only 503 "high demand"
 * responses get extra attempts with backoff (they self-resolve within
 * seconds); quota exhaustion (429) fails fast since retrying only burns
 * more of the same exhausted quota, and other errors (bad JSON, schema
 * mismatch) get a single immediate retry since they're less likely to be
 * load-related.
 */
async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  const delays = [0, 500, 1500];
  let lastErr: unknown;
  for (let attempt = 0; attempt < delays.length; attempt++) {
    if (attempt > 0) {
      if (isAiQuotaExhausted(lastErr)) break;
      if (attempt > 1 && !isAiOverloaded(lastErr)) break;
      await sleep(delays[attempt]);
    }
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (isAiQuotaExhausted(err)) break;
    }
  }
  throw lastErr;
}

export function createGeminiProvider(): AiProvider {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }
  const ai = new GoogleGenAI({ apiKey });

  return {
    async correctText(input: CorrectTextInput) {
      const response = await ai.models.generateContent({
        model: MODEL,
        contents: buildCorrectionPrompt(input),
        config: {
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      });
      const raw = response.text ?? "";
      let parsed: unknown;
      try {
        parsed = JSON.parse(stripFences(raw));
      } catch {
        throw new Error("AI returned a non-JSON response");
      }
      return correctionResultSchema.parse(parsed);
    },

    async generateFlashcard(input: GenerateFlashcardInput) {
      return withRetry(async () => {
        const response = await ai.models.generateContent({
          model: MODEL,
          contents: buildFlashcardPrompt(input),
          config: { responseMimeType: "application/json", temperature: 0.3 },
        });
        const raw = response.text ?? "";
        let parsed: unknown;
        try {
          parsed = JSON.parse(stripFences(raw));
        } catch {
          throw new Error("AI returned a non-JSON response");
        }
        return generatedFlashcardSchema.parse(parsed);
      });
    },

    async generateFlashcards(words: string[]) {
      if (words.length === 0) return [];
      return withRetry(async () => {
        const response = await ai.models.generateContent({
          model: MODEL,
          contents: buildFlashcardBatchPrompt(words),
          config: { responseMimeType: "application/json", temperature: 0.3 },
        });
        const raw = response.text ?? "";
        let parsed: unknown;
        try {
          parsed = JSON.parse(stripFences(raw));
        } catch {
          throw new Error("AI returned a non-JSON response");
        }
        const batch = generatedFlashcardBatchSchema.parse(parsed);
        const cards: GeneratedFlashcard[] = [];
        for (const item of batch.cards) {
          const result = generatedFlashcardSchema.safeParse(item);
          if (result.success) cards.push(result.data);
        }
        return cards;
      });
    },

    async generateQuiz(input: GenerateQuizInput) {
      const response = await ai.models.generateContent({
        model: MODEL,
        contents: buildQuizPrompt(input),
        config: { responseMimeType: "application/json", temperature: 0.4 },
      });
      const raw = response.text ?? "";
      let parsed: unknown;
      try {
        parsed = JSON.parse(stripFences(raw));
      } catch {
        throw new Error("AI returned a non-JSON response");
      }
      return generatedQuizSchema.parse(parsed);
    },

    async suggestContinuation(input: SuggestContinuationInput) {
      const response = await ai.models.generateContent({
        model: MODEL,
        contents: buildContinuationPrompt(input),
        config: { responseMimeType: "application/json", temperature: 0.7 },
      });
      const raw = response.text ?? "";
      let parsed: unknown;
      try {
        parsed = JSON.parse(stripFences(raw));
      } catch {
        throw new Error("AI returned a non-JSON response");
      }
      return continuationSchema.parse(parsed);
    },
  };
}
