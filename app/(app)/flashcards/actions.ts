"use server";

import { revalidatePath } from "next/cache";
import { getAiProvider } from "@/lib/ai";
import { reviewCard, type SrsGrade } from "@/lib/srs";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

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
