import { GoogleGenAI } from "@google/genai";
import { buildTranslateToVietnamesePrompt } from "@/lib/ai/prompts";
import { ollamaStreamText } from "@/lib/ai/ollama";

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { text?: string; source?: string };
    const text = body.text?.trim();
    const source = body.source ?? "message";

    if (!text) {
      return new Response("Missing text", { status: 400 });
    }

    const prompt = buildTranslateToVietnamesePrompt(text, source);
    const useOllama = process.env.AI_PROVIDER === "ollama";

    if (!useOllama && !process.env.GEMINI_API_KEY) {
      return new Response("API key not configured", { status: 500 });
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          if (useOllama) {
            for await (const part of ollamaStreamText(prompt, 0.1)) {
              controller.enqueue(encoder.encode(part));
            }
          } else {
            const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
            const genStream = await ai.models.generateContentStream({
              model: MODEL,
              contents: prompt,
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
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return new Response(msg, { status: 500 });
  }
}
