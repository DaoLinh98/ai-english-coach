import { getSessionUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SignInPrompt } from "@/components/SignInPrompt";
import { QuizScreen } from "@/components/screens/QuizScreen";
import { generateQuiz, recordAttempt } from "./actions";

export default async function QuizPage() {
  const session = await getSessionUser();
  if (!session) return <SignInPrompt feature="Quiz & Progress" />;

  let attempts = 0;
  let bestPct = 0;
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("quiz_attempts")
      .select("score,total")
      .eq("user_id", session.id);
    const rows = (data ?? []) as { score: number; total: number }[];
    attempts = rows.length;
    bestPct = rows.reduce((best, r) => {
      const pct = r.total > 0 ? Math.round((r.score / r.total) * 100) : 0;
      return pct > best ? pct : best;
    }, 0);
  } catch {
    attempts = 0;
    bestPct = 0;
  }

  return (
    <QuizScreen
      generateQuiz={generateQuiz}
      recordAttempt={recordAttempt}
      attempts={attempts}
      bestPct={bestPct}
    />
  );
}
