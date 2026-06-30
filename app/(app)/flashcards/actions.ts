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

/**
 * Directly generate and save a flashcard for a word/phrase from the Editor.
 * Called immediately when the user clicks "+ Add" — no localStorage queue needed.
 */
export async function addFlashcardDirect(
  phrase: string,
): Promise<{ success: boolean; message: string }> {
  const w = phrase.trim();
  if (!w) return { success: false, message: "Empty phrase" };

  let supabase: Awaited<ReturnType<typeof createClient>>;
  let userId: string;
  try {
    const auth = await requireUser();
    supabase = auth.supabase;
    userId = auth.user.id;
  } catch {
    return { success: false, message: "Sign in to save flashcards" };
  }

  // Duplicate check
  const { data: existing } = await supabase
    .from("flashcards")
    .select("id")
    .eq("user_id", userId)
    .ilike("word", w)
    .limit(1);
  if (existing && existing.length > 0) {
    return { success: false, message: `"${w}" is already in your deck` };
  }

  const card = await getAiProvider().generateFlashcard({ word: w });
  const { error } = await supabase.from("flashcards").insert({
    user_id: userId,
    word: card.word,
    pos: card.pos,
    level: card.level,
    context: card.context,
    def: card.def,
    example: card.example,
    synonyms: card.synonyms,
    phonetic: card.phonetic,
  });
  if (error) return { success: false, message: "Failed to save — please try again" };

  revalidatePath("/flashcards");
  return { success: true, message: `"${card.word}" added to Flashcards!` };
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
    phonetic: card.phonetic,
  });
  revalidatePath("/flashcards");
}
