import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SettingsScreen } from "@/components/screens/SettingsScreen";
import { SignInPrompt } from "@/components/SignInPrompt";
import { updateProfile, addVocab, removeVocab, requestPasswordReset } from "./actions";
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
    const vocabData = await prisma.preferredVocabulary.findMany({
      where: { userId: session.id },
      select: { term: true },
      orderBy: { createdAt: "asc" },
    });
    vocab = vocabData.map((v) => v.term);

    const hist = await prisma.correctionHistory.findMany({
      where: { userId: session.id },
      select: { createdAt: true, outputText: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    const histories: HistoryRow[] = hist.map((h) => ({
      created_at: h.createdAt.toISOString(),
      output_text: h.outputText,
    }));
    totalWords = histories.reduce((s, h) => s + wordCount(h.output_text), 0);
    streak = computeStreak(histories);

    const attempts = await prisma.quizAttempt.findMany({
      where: { userId: session.id },
      select: { score: true, total: true },
    });
    if (attempts.length) {
      const score = attempts.reduce((s, r) => s + r.score, 0);
      const total = attempts.reduce((s, r) => s + r.total, 0);
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
      requestPasswordReset={requestPasswordReset}
      signOut={signOut}
    />
  );
}
