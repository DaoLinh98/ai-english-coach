import { GoogleGenAI } from "@google/genai";

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

function buildTranslationPrompt(text: string): string {
  return `You are an expert English editor and translator working with software developers and office professionals.

The user has written text that may be a mix of Vietnamese and English. Your tasks:
1. Translate any Vietnamese portions into natural, professional English
2. Fix all grammar, spelling, punctuation, and sentence structure issues
3. Ensure the result reads as fluent, cohesive English

Return ONLY the corrected English text. No explanation, no commentary, no JSON wrapper — just the final text.

TEXT:
"""
${text}
"""`;
}

export async function POST(req: Request) {
  const body = await req.json() as { text?: string };
  const text = body.text?.trim();

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
          contents: buildTranslationPrompt(text),
          config: { temperature: 0.1 },
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
