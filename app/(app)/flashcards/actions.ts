"use server";

import { revalidatePath } from "next/cache";
import { getAiProvider } from "@/lib/ai";
import { createClient } from "@/lib/supabase/server";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, user };
}

export async function toggleLearned(id: string, learned: boolean) {
  const { supabase, user } = await requireUser();
  await supabase
    .from("flashcards")
    .update({ learned, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);
  revalidatePath("/flashcards");
}

export async function deleteFlashcard(id: string) {
  const { supabase, user } = await requireUser();
  await supabase.from("flashcards").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/flashcards");
}

export async function createFromWord(word: string, context?: string) {
  const w = word.trim();
  if (!w) return;
  const { supabase, user } = await requireUser();
  const card = await getAiProvider().generateFlashcard({ word: w, context });
  await supabase.from("flashcards").insert({
    user_id: user.id,
    word: card.word,
    pos: card.pos,
    level: card.level,
    context: card.context,
    def: card.def,
    example: card.example,
    synonyms: card.synonyms,
  });
  revalidatePath("/flashcards");
}

/**
 * Generate + save flashcards for a batch of words (from the editor's "Learn"
 * queue), skipping words already in the user's deck. Returns the count added.
 */
export async function importQueue(words: string[]): Promise<number> {
  const { supabase, user } = await requireUser();
  const ai = getAiProvider();

  const { data: existing } = await supabase
    .from("flashcards")
    .select("word")
    .eq("user_id", user.id);
  const have = new Set((existing ?? []).map((r: { word: string }) => r.word.toLowerCase()));

  let added = 0;
  for (const raw of words) {
    const w = raw.trim();
    if (!w || have.has(w.toLowerCase())) continue;
    try {
      const card = await ai.generateFlashcard({ word: w });
      const { error } = await supabase.from("flashcards").insert({
        user_id: user.id,
        word: card.word,
        pos: card.pos,
        level: card.level,
        context: card.context,
        def: card.def,
        example: card.example,
        synonyms: card.synonyms,
      });
      if (!error) {
        have.add(w.toLowerCase());
        added++;
      }
    } catch {
      // skip words the model can't process
    }
  }
  revalidatePath("/flashcards");
  return added;
}
