import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DashboardScreen, type DashboardData } from "@/components/screens/DashboardScreen";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const baseData: DashboardData = {
  name: "Ada",
  stats: [
    { id: "words", label: "Words Improved", value: 10, delta: null, icon: "trend-up", color: "var(--amber-d)", bg: "var(--amber-ll)" },
    { id: "corrects", label: "Corrections Applied", value: 2, delta: null, icon: "check", color: "var(--green)", bg: "var(--green-l)" },
    { id: "cards", label: "Flashcards Learned", value: 0, delta: null, icon: "book", color: "var(--blue)", bg: "var(--blue-l)" },
    { id: "accuracy", label: "Quiz Accuracy", value: "—", delta: null, icon: "target", color: "var(--purple)", bg: "var(--purp-l)" },
  ],
  activity: [],
  weeklyGoal: 100,
  weeklyWords: 0,
  streak: 0,
  scoreTrend: [],
};

describe("DashboardScreen score trend chart", () => {
  it("shows an empty state when there are no quiz attempts", () => {
    render(<DashboardScreen data={baseData} />);
    expect(screen.getByText("No quiz attempts yet")).toBeInTheDocument();
  });

  it("renders a chart with the latest score when attempts exist", () => {
    const data: DashboardData = {
      ...baseData,
      scoreTrend: [
        { id: "1", pct: 40, date: "2026-06-01T00:00:00.000Z" },
        { id: "2", pct: 60, date: "2026-06-15T00:00:00.000Z" },
        { id: "3", pct: 80, date: "2026-07-01T00:00:00.000Z" },
      ],
    };
    render(<DashboardScreen data={data} />);
    expect(screen.getByText("Latest 80%")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Quiz score trend across 3 attempts/i })).toBeInTheDocument();
  });

  it("renders a flat single-point chart without crashing", () => {
    const data: DashboardData = {
      ...baseData,
      scoreTrend: [{ id: "1", pct: 75, date: "2026-07-01T00:00:00.000Z" }],
    };
    render(<DashboardScreen data={data} />);
    expect(screen.getByRole("img", { name: /Quiz score trend across 1 attempt,/i })).toBeInTheDocument();
  });
});
