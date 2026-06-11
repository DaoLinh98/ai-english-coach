import { getSessionUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SettingsScreen } from "@/components/screens/SettingsScreen";
import { SignInPrompt } from "@/components/SignInPrompt";
import { updateProfile, addVocab, removeVocab } from "./actions";
import { signOut } from "@/app/(auth)/actions";

type HistoryRow = { created_at: string; output_text: string };

function wordCount(text: string): number {
  const m = text.trim().match(/\S+/g);
  return m ? m.length : 0;
}

function dayKey(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA"); // YYYY-MM-DD (local)
}

function computeStreak(histories: HistoryRow[]): number {
  if (!histories.length) return 0;
  const days = new Set(histories.map((h) => dayKey(h.created_at)));
  const cursor = new Date();
  // Allow the streak to count from yesterday if there's nothing today yet.
  if (!days.has(cursor.toLocaleDateString("en-CA"))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!days.has(cursor.toLocaleDateString("en-CA"))) return 0;
  }
  let streak = 0;
  while (days.has(cursor.toLocaleDateString("en-CA"))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export default async function SettingsPage() {
  const session = await getSessionUser();
  if (!session) return <SignInPrompt feature="Settings" />;

  let vocab: string[] = [];
  let streak = 0;
  let totalWords = 0;
  let accuracy: number | null = null;

  try {
    const supabase = await createClient();

    const { data: vocabData } = await supabase
      .from("preferred_vocabulary")
      .select("term")
      .eq("user_id", session.id)
      .order("created_at", { ascending: true });
    vocab = (vocabData ?? []).map((v: { term: string }) => v.term);

    const { data: hist } = await supabase
      .from("correction_history")
      .select("created_at,output_text")
      .eq("user_id", session.id)
      .order("created_at", { ascending: false })
      .limit(200);
    const histories = (hist ?? []) as HistoryRow[];
    totalWords = histories.reduce((s, h) => s + wordCount(h.output_text), 0);
    streak = computeStreak(histories);

    const { data: attempts } = await supabase
      .from("quiz_attempts")
      .select("score,total")
      .eq("user_id", session.id);
    const rows = (attempts ?? []) as { score: number; total: number }[];
    if (rows.length) {
      const score = rows.reduce((s, r) => s + r.score, 0);
      const total = rows.reduce((s, r) => s + r.total, 0);
      accuracy = total > 0 ? Math.round((score / total) * 100) : null;
    }
  } catch {
    // Tolerate a partially-provisioned DB; render with whatever we have.
  }

  return (
    <SettingsScreen
      email={session.email ?? ""}
      profile={session.profile}
      vocab={vocab}
      stats={{ streak, totalWords, accuracy }}
      updateProfile={updateProfile}
      addVocab={addVocab}
      removeVocab={removeVocab}
      signOut={signOut}
    />
  );
}
