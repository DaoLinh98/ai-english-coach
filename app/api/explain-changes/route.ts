import { GoogleGenAI } from "@google/genai";
import { changeExplanationResultSchema } from "@/lib/ai/schema";
import { buildChangeExplanationPrompt, stripFences } from "@/lib/ai/prompts";
import { ollamaChatJson } from "@/lib/ai/ollama";

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";

async function generateWithGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      temperature: 0.2,
    },
  });
  return response.text ?? "";
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { original?: string; corrected?: string };
    const original = body.original?.trim();
    const corrected = body.corrected?.trim();

    if (!original || !corrected) {
      return Response.json({ items: [] });
    }

    const prompt = buildChangeExplanationPrompt(original, corrected);
    const raw =
      process.env.AI_PROVIDER === "ollama"
        ? await ollamaChatJson(prompt, 0.2)
        : await generateWithGemini(prompt);

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
