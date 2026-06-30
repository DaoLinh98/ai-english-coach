import { GoogleGenAI } from "@google/genai";

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const SOURCE_GUIDE: Record<string, string> = {
  message: "a direct message or chat message from a client or colleague",
  comment: "a code review comment or inline feedback",
  ticket: "a Jira ticket, issue description, or task card",
  document: "a technical document, specification, or report",
};

function buildPrompt(text: string, source: string): string {
  const ctx = SOURCE_GUIDE[source] ?? SOURCE_GUIDE.message;
  return `You are a technical translator specializing in software development and IT communication.

Translate the following English text into natural Vietnamese. This text is ${ctx}.

Rules:
- Keep ALL technical terms in English exactly as written: API, PR, deploy, refactor, merge, sprint, backend, frontend, debug, framework, endpoint, repo, CI/CD, LGTM, etc.
- Keep code snippets, variable names, and URLs unchanged.
- Use natural, fluent Vietnamese — not robotic machine translation.
- Preserve the tone (professional stays professional, casual stays casual).
- Return ONLY the Vietnamese translation. No explanation, no original text, no commentary.

ENGLISH TEXT:
"""
${text}
"""`;
}

export async function POST(req: Request) {
  const body = (await req.json()) as { text?: string; source?: string };
  const text = body.text?.trim();
  const source = body.source ?? "message";

  if (!text) {
    return new Response("Missing text", { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response("API not configured", { status: 500 });
  }

  const ai = new GoogleGenAI({ apiKey });
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const genStream = await ai.models.generateContentStream({
          model: MODEL,
          contents: buildPrompt(text, source),
          config: {
            temperature: 0.1,
            thinkingConfig: { thinkingBudget: 0 },
          },
        });

        for await (const chunk of genStream) {
          const part = chunk.text;
          if (part) {
            controller.enqueue(encoder.encode(part));
          }
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
