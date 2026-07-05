import { getAiProvider } from "@/lib/ai";

/**
 * Pre-generates flashcard content for the Editor's vocabulary suggestions
 * in one batched model call, right after translation. The Editor caches the
 * result client-side so "+ Add" persists instantly with no further model
 * call — cutting per-click AI calls (and failures) from N down to 1 per
 * translation, best-effort (a failure here just means "+ Add" falls back to
 * generating on demand).
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { words?: string[] };
    const words = (body.words ?? []).map((w) => w.trim()).filter(Boolean).slice(0, 12);
    if (words.length === 0) return Response.json({ cards: [] });

    const cards = await getAiProvider().generateFlashcards(words);
    return Response.json({ cards });
  } catch {
    return Response.json({ cards: [] });
  }
}
