"use server";

import { revalidatePath } from "next/cache";
import { getAiProvider } from "@/lib/ai";
import type { GeneratedFlashcard } from "@/lib/ai/schema";
import { reviewCard, type SrsGrade } from "@/lib/srs";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { user };
}


/**
 * Grade a card's recall and reschedule it via the SM-2 algorithm.
 * `learned` is kept in sync as a simple "has this card graduated past its
 * first successful review" signal, for the existing Known/Reviewing badges.
 */
export async function reviewFlashcard(id: string, grade: SrsGrade) {
  const { user } = await requireUser();

  const current = await prisma.flashcard.findFirst({
    where: { id, userId: user.id },
    select: { easeFactor: true, intervalDays: true, reviewCount: true },
  });

  const next = reviewCard(
    {
      easeFactor: current?.easeFactor ?? 2.5,
      intervalDays: current?.intervalDays ?? 0,
      reviewCount: current?.reviewCount ?? 0,
    },
    grade,
  );

  await prisma.flashcard.updateMany({
    where: { id, userId: user.id },
    data: {
      easeFactor: next.easeFactor,
      intervalDays: next.intervalDays,
      reviewCount: next.reviewCount,
      dueDate: new Date(next.dueDate),
      learned: next.reviewCount > 0,
      updatedAt: new Date(),
    },
  });

  revalidatePath("/flashcards");
}

export async function deleteFlashcard(id: string) {
  const { user } = await requireUser();
  await prisma.flashcard.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/flashcards");
}

/**
 * Directly save a flashcard for a word/phrase from the Editor. Called
 * immediately when the user clicks "+ Add" — no localStorage queue needed.
 *
 * `draft`, when provided, is a flashcard already generated for this word by
 * the Editor's batched pre-fetch (see /api/vocab-flashcards). Passing it
 * skips the per-click model call entirely, which is both faster and removes
 * the model call as a failure point for the common case; a fresh call only
 * happens when no draft is available (e.g. the batch pre-fetch missed/failed
 * for this word).
 */
export async function addFlashcardDirect(
  phrase: string,
  draft?: GeneratedFlashcard,
): Promise<{ success: boolean; message: string }> {
  const w = phrase.trim();
  if (!w) return { success: false, message: "Empty phrase" };

  let userId: string;
  try {
    const auth = await requireUser();
    userId = auth.user.id;
  } catch {
    return { success: false, message: "Sign in to save flashcards" };
  }

  // Duplicate check (normalised — the DB unique index below is the atomic
  // source of truth; this just gives a friendlier message in the common case).
  const existing = await prisma.flashcard.findFirst({
    where: { userId, word: { equals: w, mode: "insensitive" } },
    select: { id: true },
  });
  if (existing) {
    return { success: false, message: `"${w}" is already in your deck` };
  }

  let card: GeneratedFlashcard;
  if (draft) {
    card = draft;
  } else {
    try {
      card = await getAiProvider().generateFlashcard({ word: w });
    } catch {
      return { success: false, message: "AI generation failed — please try again" };
    }
  }

  try {
    await prisma.flashcard.create({
      data: {
        userId,
        word: card.word,
        pos: card.pos,
        level: card.level,
        context: card.context,
        def: card.def,
        example: card.example,
        synonyms: card.synonyms,
        phonetic: card.phonetic || null,
        // No explicit tag at creation time — default to part-of-speech.
        tag: card.pos || null,
      },
    });
  } catch (err) {
    // Unique violation from flashcards_user_word_unique — a concurrent click
    // beat this one to the insert; treat it as a duplicate, not a failure.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { success: false, message: `"${w}" is already in your deck` };
    }
    console.error("addFlashcardDirect insert failed:", err);
    return { success: false, message: "Failed to save — please try again" };
  }

  revalidatePath("/flashcards");
  return { success: true, message: `"${card.word}" added to Flashcards!` };
}

export async function createFromWord(word: string, context?: string, tag?: string) {
  const w = word.trim();
  if (!w) return;
  const { user } = await requireUser();
  const card = await getAiProvider().generateFlashcard({ word: w, context });
  await prisma.flashcard.create({
    data: {
      userId: user.id,
      word: card.word,
      pos: card.pos,
      level: card.level,
      context: card.context,
      def: card.def,
      example: card.example,
      synonyms: card.synonyms,
      phonetic: card.phonetic,
      // Use the explicit tag when provided, otherwise default to part-of-speech.
      tag: tag?.trim() || card.pos || null,
    },
  });
  revalidatePath("/flashcards");
}

/**
 * Update a flashcard's tag/category. Used by the Flashcards screen's tag
 * filter UI to let users (re)assign a tag, including clearing it back to
 * "Uncategorized" by passing an empty string.
 */
export async function updateFlashcardTag(id: string, tag: string) {
  const { user } = await requireUser();
  const trimmed = tag.trim();
  await prisma.flashcard.updateMany({
    where: { id, userId: user.id },
    data: { tag: trimmed || null, updatedAt: new Date() },
  });
  revalidatePath("/flashcards");
}
