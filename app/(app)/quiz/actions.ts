"use server";

import { revalidatePath } from "next/cache";
import { getAiProvider, type QuizQuestion } from "@/lib/ai";
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

export type QuizPayload = { quizId: string; questions: QuizQuestion[] };

/**
 * Generate a quiz personalized from the user's saved vocabulary and recent
 * correction mistakes, persist it, and return it for the client to take.
 */
export async function generateQuiz(): Promise<QuizPayload> {
  const { user } = await requireUser();

  const cards = await prisma.flashcard.findMany({
    where: { userId: user.id },
    select: { word: true },
    take: 15,
  });
  const vocab = cards.map((c) => c.word);

  const hist = await prisma.correctionHistory.findMany({
    where: { userId: user.id },
    select: { id: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  const ids = hist.map((h) => h.id);

  let mistakes: string[] = [];
  if (ids.length) {
    const items = await prisma.correctionItem.findMany({
      where: { historyId: { in: ids } },
      select: { find: true, suggest: true },
      take: 15,
    });
    mistakes = items.map((i) => `${i.find} → ${i.suggest}`);
  }

  const quiz = await getAiProvider().generateQuiz({ vocab, mistakes, count: 5 });

  const row = await prisma.quiz.create({
    data: {
      userId: user.id,
      questions: quiz.questions as unknown as Prisma.InputJsonValue,
    },
    select: { id: true },
  });

  return { quizId: row.id, questions: quiz.questions };
}

export async function recordAttempt(
  quizId: string,
  score: number,
  total: number,
  answers: unknown,
) {
  const { user } = await requireUser();
  await prisma.quizAttempt.create({
    data: {
      quizId,
      userId: user.id,
      score,
      total,
      answers: answers as Prisma.InputJsonValue,
    },
  });
  revalidatePath("/quiz");
}
