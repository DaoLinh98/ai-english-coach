"use server";

import { revalidatePath } from "next/cache";
import { getAiProvider } from "@/lib/ai";
import type { GeneratedFlashcard } from "@/lib/ai/schema";
import { reviewCard, type SrsGrade } from "@/lib/srs";
import { createClient } from "@/lib/supabase/server";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, user };
}


/**
 * Grade a card's recall and reschedule it via the SM-2 algorithm.
 * `learned` is kept in sync as a simple "has this card graduated past its
 * first successful review" signal, for the existing Known/Reviewing badges.
 */
export async function reviewFlashcard(id: string, grade: SrsGrade) {
  const { supabase, user } = await requireUser();

  const { data: current } = await supabase
    .from("flashcards")
    .select("ease_factor, interval_days, review_count")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  const next = reviewCard(
    {
      easeFactor: current?.ease_factor ?? 2.5,
      intervalDays: current?.interval_days ?? 0,
      reviewCount: current?.review_count ?? 0,
    },
    grade,
  );

  await supabase
    .from("flashcards")
    .update({
      ease_factor: next.easeFactor,
      interval_days: next.intervalDays,
      review_count: next.reviewCount,
      due_date: next.dueDate,
      learned: next.reviewCount > 0,
      updated_at: new Date().toISOString(),
    })
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

  let card: GeneratedFlashcard;
  try {
    card = await getAiProvider().generateFlashcard({ word: w });
  } catch {
    return { success: false, message: "AI generation failed — please try again" };
  }

  const { error } = await supabase.from("flashcards").insert({
    user_id: userId,
    word: card.word,
    pos: card.pos,
    level: card.level,
    context: card.context,
    def: card.def,
    example: card.example,
    synonyms: card.synonyms,
    phonetic: card.phonetic || null,
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
