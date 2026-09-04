import { buildTranslateToVietnamesePrompt } from "@/lib/ai/prompts";
import { ollamaStreamText } from "@/lib/ai/ollama";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { text?: string; source?: string };
    const text = body.text?.trim();
    const source = body.source ?? "message";

    if (!text) {
      return new Response("Missing text", { status: 400 });
    }

    const prompt = buildTranslateToVietnamesePrompt(text, source);
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const part of ollamaStreamText(prompt, 0.1)) {
            controller.enqueue(encoder.encode(part));
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
