import { GoogleGenAI } from "@google/genai";
import { changeExplanationResultSchema } from "@/lib/ai/schema";

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";

function buildPrompt(original: string, corrected: string): string {
  return `You are an expert English writing coach. Compare the ORIGINAL text (written by a non-native English speaker, possibly mixed with Vietnamese) with the CORRECTED text (translated and fixed).

Identify up to 6 of the most notable/instructive corrections (grammar, style, or word choice) and explain each one so the learner understands the rule involved.

Return ONLY a JSON object (no markdown, no commentary) with this exact shape:
{
  "items": [
    {
      "text": string,   // an EXACT, verbatim substring of the CORRECTED text that this explanation refers to (must appear in the corrected text)
      "label": string,  // short issue name, e.g. "Subject-verb agreement"
      "expl": string,   // one or two sentences explaining the rule and why the correction was made
      "rule": string    // the rule name, e.g. "Passive Voice"
    }
  ]
}

If there are no instructive corrections to explain, return { "items": [] }.

ORIGINAL:
"""
${original}
"""

CORRECTED:
"""
${corrected}
"""`;
}

function stripFences(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith("```")) {
    return trimmed
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();
  }
  return trimmed;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { original?: string; corrected?: string };
    const original = body.original?.trim();
    const corrected = body.corrected?.trim();

    if (!original || !corrected) {
      return Response.json({ items: [] });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response("API key not configured", { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: buildPrompt(original, corrected),
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
