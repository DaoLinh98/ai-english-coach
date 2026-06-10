"use server";

import { revalidatePath } from "next/cache";
import { getAiProvider, type QuizQuestion } from "@/lib/ai";
import { createClient } from "@/lib/supabase/server";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, user };
}

export type QuizPayload = { quizId: string; questions: QuizQuestion[] };

/**
 * Generate a quiz personalized from the user's saved vocabulary and recent
 * correction mistakes, persist it, and return it for the client to take.
 */
export async function generateQuiz(): Promise<QuizPayload> {
  const { supabase, user } = await requireUser();

  const { data: cards } = await supabase
    .from("flashcards")
    .select("word")
    .eq("user_id", user.id)
    .limit(15);
  const vocab = (cards ?? []).map((c: { word: string }) => c.word);

  const { data: hist } = await supabase
    .from("correction_history")
    .select("id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);
  const ids = (hist ?? []).map((h: { id: string }) => h.id);

  let mistakes: string[] = [];
  if (ids.length) {
    const { data: items } = await supabase
      .from("correction_items")
      .select("find,suggest")
      .in("history_id", ids)
      .limit(15);
    mistakes = (items ?? []).map(
      (i: { find: string; suggest: string }) => `${i.find} → ${i.suggest}`,
    );
  }

  const quiz = await getAiProvider().generateQuiz({ vocab, mistakes, count: 5 });

  const { data: row, error } = await supabase
    .from("quizzes")
    .insert({ user_id: user.id, questions: quiz.questions })
    .select("id")
    .single();
  if (error || !row) throw new Error(error?.message ?? "Failed to save quiz");

  return { quizId: row.id, questions: quiz.questions };
}

export async function recordAttempt(
  quizId: string,
  score: number,
  total: number,
  answers: unknown,
) {
  const { supabase, user } = await requireUser();
  await supabase.from("quiz_attempts").insert({
    quiz_id: quizId,
    user_id: user.id,
    score,
    total,
    answers,
  });
  revalidatePath("/quiz");
}
