import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QuizScreen } from "@/components/screens/QuizScreen";
import type { QuizQuestion } from "@/lib/ai";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

function makeQuestions(count: number): QuizQuestion[] {
  return Array.from({ length: count }, (_, i) => ({
    category: "grammar" as const,
    q: `Question ${i + 1}?`,
    opts: ["A", "B", "C", "D"],
    answer: 0,
    expl: "Because grammar.",
    rule: "Rule",
  }));
}

describe("QuizScreen timed mode", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows an opt-in Timed mode toggle on the ready phase, off by default", () => {
    render(
      <QuizScreen
        generateQuiz={vi.fn()}
        recordAttempt={vi.fn()}
        attempts={0}
        bestPct={0}
      />,
    );
    const toggle = screen.getByRole("switch", { name: "Timed mode" });
    expect(toggle).toHaveAttribute("aria-checked", "false");
  });

  it("does not show a countdown when timed mode is left off", async () => {
    const generateQuiz = vi.fn().mockResolvedValue({
      quizId: "quiz-1",
      questions: makeQuestions(1),
    });
    render(
      <QuizScreen
        generateQuiz={generateQuiz}
        recordAttempt={vi.fn()}
        attempts={0}
        bestPct={0}
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /generate quiz/i }));
      await Promise.resolve();
    });

    expect(screen.queryByText(/^\d+s$/)).not.toBeInTheDocument();
  });

  it("shows a countdown, times out, and auto-advances without crashing", async () => {
    const recordAttempt = vi.fn().mockResolvedValue(undefined);
    const generateQuiz = vi.fn().mockResolvedValue({
      quizId: "quiz-1",
      questions: makeQuestions(2),
    });
    render(
      <QuizScreen
        generateQuiz={generateQuiz}
        recordAttempt={recordAttempt}
        attempts={0}
        bestPct={0}
      />,
    );

    // Opt into timed mode before starting.
    fireEvent.click(screen.getByRole("switch", { name: "Timed mode" }));

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /generate quiz/i }));
      await Promise.resolve();
    });

    // Countdown badge visible for question 1.
    expect(screen.getByText("30s")).toBeInTheDocument();

    // Let the countdown run out without selecting an answer (tick 1s at a
    // time so effects get a chance to reschedule between ticks).
    for (let i = 0; i < 30; i++) {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1_000);
      });
    }
    // One extra tick to flush the zero-delay timeout that fires handleTimeout.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(screen.getByText("Time's up!")).toBeInTheDocument();

    // Auto-advance fires after the timeout delay.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_500);
    });
    expect(screen.getByText("Question 2 / 2")).toBeInTheDocument();
    expect(screen.getByText("30s")).toBeInTheDocument();

    // Time out the second (last) question too — should reach results, not crash.
    for (let i = 0; i < 30; i++) {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1_000);
      });
    }
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_500);
    });
    expect(screen.getByText("Quiz Complete")).toBeInTheDocument();
    expect(screen.getByText("0%")).toBeInTheDocument();

    // recordAttempt still fires, with both timed-out questions counted as incorrect.
    await act(async () => {
      await Promise.resolve();
    });
    expect(recordAttempt).toHaveBeenCalledTimes(1);
    expect(recordAttempt).toHaveBeenCalledWith(
      "quiz-1",
      0,
      2,
      [
        { qId: 0, chosen: -1, correct: false },
        { qId: 1, chosen: -1, correct: false },
      ],
    );
  });
});
