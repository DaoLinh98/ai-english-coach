import { changeExplanationResultSchema } from "@/lib/ai/schema";
import { buildChangeExplanationPrompt, stripFences } from "@/lib/ai/prompts";
import { ollamaChatJson } from "@/lib/ai/ollama";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { original?: string; corrected?: string };
    const original = body.original?.trim();
    const corrected = body.corrected?.trim();

    if (!original || !corrected) {
      return Response.json({ items: [] });
    }

    const prompt = buildChangeExplanationPrompt(original, corrected);
    const raw = await ollamaChatJson(prompt, 0.2);

    let parsed: unknown;
    try {
      parsed = JSON.parse(stripFences(raw));
    } catch {
      return Response.json({ items: [] });
    }

    const result = changeExplanationResultSchema.safeParse(parsed);
    if (!result.success) {
      return Response.json({ items: [] });
    }

    return Response.json(result.data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return new Response(msg, { status: 500 });
  }
}
