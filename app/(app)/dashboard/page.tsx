import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SignInPrompt } from "@/components/SignInPrompt";
import {
  DashboardScreen,
  type DashboardActivity,
  type DashboardData,
  type DashboardStat,
  type ScoreTrendPoint,
} from "@/components/screens/DashboardScreen";

type HistoryRow = {
  id: string;
  context: string;
  input_text: string;
  output_text: string;
  created_at: string;
};

const CONTEXT_META: Record<string, { label: string; icon: DashboardActivity["icon"]; color: string }> = {
  email: { label: "Email", icon: "mail", color: "var(--blue)" },
  slack: { label: "Slack", icon: "msg-sq", color: "var(--green)" },
  jira: { label: "Jira", icon: "file-txt", color: "var(--purple)" },
  notes: { label: "Notes", icon: "clipboard", color: "var(--orange-d)" },
};

function wordCount(text: string): number {
  const m = text.trim().match(/\S+/g);
  return m ? m.length : 0;
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hour${hr !== 1 ? "s" : ""} ago`;
  const day = Math.floor(hr / 24);
  if (day === 1) return "Yesterday";
  if (day < 7) return `${day} days ago`;
  return new Date(iso).toLocaleDateString();
}

function deriveTitle(text: string): string {
  const firstLine = text.trim().split(/\n/)[0]?.trim() ?? "";
  const words = firstLine.split(/\s+/).slice(0, 8).join(" ");
  if (!words) return "Untitled draft";
  return words.length < firstLine.length ? `${words}…` : words;
}

function dayKey(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA"); // YYYY-MM-DD (local)
}

function computeStreak(histories: HistoryRow[]): number {
  if (!histories.length) return 0;
  const days = new Set(histories.map((h) => dayKey(h.created_at)));
  const today = new Date();
  let cursor = new Date(today);
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

export default async function DashboardPage() {
  const session = await getSessionUser();
  if (!session) return <SignInPrompt feature="Dashboard" />;

  const name = session.profile?.name?.trim() || session.email?.split("@")[0] || "there";
  const weeklyGoal = session.profile?.weekly_goal ?? 100;

  let histories: HistoryRow[] = [];
  let itemCountByHistory = new Map<string, number>();
  let totalCorrections = 0;
  let cardsLearned = 0;
  let accuracy: number | null = null;
  let scoreTrend: ScoreTrendPoint[] = [];

  try {
    const hist = await prisma.correctionHistory.findMany({
      where: { userId: session.id },
      select: { id: true, context: true, inputText: true, outputText: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    histories = hist.map((h) => ({
      id: h.id,
      context: h.context,
      input_text: h.inputText,
      output_text: h.outputText,
      created_at: h.createdAt.toISOString(),
    }));

    const ids = histories.map((h) => h.id);
    if (ids.length) {
      const items = await prisma.correctionItem.findMany({
        where: { historyId: { in: ids } },
        select: { historyId: true },
      });
      for (const it of items) {
        itemCountByHistory.set(it.historyId, (itemCountByHistory.get(it.historyId) ?? 0) + 1);
        totalCorrections++;
      }
    }

    cardsLearned = await prisma.flashcard.count({
      where: { userId: session.id, learned: true },
    });

    const attempts = await prisma.quizAttempt.findMany({
      where: { userId: session.id },
      select: { id: true, score: true, total: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });
    const rows = attempts.map((r) => ({
      id: r.id,
      score: r.score,
      total: r.total,
      created_at: r.createdAt.toISOString(),
    }));
    if (rows.length) {
      const score = rows.reduce((s, r) => s + r.score, 0);
      const total = rows.reduce((s, r) => s + r.total, 0);
      accuracy = total > 0 ? Math.round((score / total) * 100) : null;
    }
    scoreTrend = rows.slice(-20).map((r) => ({
      id: r.id,
      pct: r.total > 0 ? Math.round((r.score / r.total) * 100) : 0,
      date: r.created_at,
    }));
  } catch {
    // Tolerate a partially-provisioned DB; render with whatever we have.
  }

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weekHistories = histories.filter((h) => new Date(h.created_at).getTime() >= weekAgo);
  const totalWords = histories.reduce((s, h) => s + wordCount(h.output_text), 0);
  const weeklyWords = weekHistories.reduce((s, h) => s + wordCount(h.output_text), 0);
  const weeklyCorrections = weekHistories.reduce((s, h) => s + (itemCountByHistory.get(h.id) ?? 0), 0);

  const stats: DashboardStat[] = [
    {
      id: "words",
      label: "Words Improved",
      value: totalWords,
      delta: weeklyWords > 0 ? `+${weeklyWords}` : null,
      icon: "trend-up",
      color: "var(--amber-d)",
      bg: "var(--amber-ll)",
    },
    {
      id: "corrects",
      label: "Corrections Applied",
      value: totalCorrections,
      delta: weeklyCorrections > 0 ? `+${weeklyCorrections}` : null,
      icon: "check",
      color: "var(--green)",
      bg: "var(--green-l)",
    },
    {
      id: "cards",
      label: "Flashcards Learned",
      value: cardsLearned,
      delta: null,
      icon: "book",
      color: "var(--blue)",
      bg: "var(--blue-l)",
    },
    {
      id: "accuracy",
      label: "Quiz Accuracy",
      value: accuracy === null ? "—" : `${accuracy}%`,
      delta: null,
      icon: "target",
      color: "var(--purple)",
      bg: "var(--purp-l)",
    },
  ];

  const activity: DashboardActivity[] = histories.slice(0, 5).map((h) => {
    const meta = CONTEXT_META[h.context] ?? { label: h.context, icon: "file-txt" as const, color: "var(--t3)" };
    return {
      id: h.id,
      context: meta.label,
      title: deriveTitle(h.input_text),
      corrections: itemCountByHistory.get(h.id) ?? 0,
      time: relativeTime(h.created_at),
      icon: meta.icon,
      color: meta.color,
    };
  });

  const data: DashboardData = {
    name,
    stats,
    activity,
    weeklyGoal,
    weeklyWords,
    streak: computeStreak(histories),
    scoreTrend,
  };

  return <DashboardScreen data={data} />;
}
