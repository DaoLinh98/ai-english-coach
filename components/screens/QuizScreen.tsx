"use client";
// components/screens/QuizScreen.tsx — ported from prototype screen-quiz.jsx,
// wired to AI quiz generation + attempt persistence.

import React from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Icon, ProgressBar, Spinner, Toggle } from "@/components/ui";
import type { QuizQuestion } from "@/lib/ai";
import type { QuizPayload } from "@/app/(app)/quiz/actions";

const catColor: Record<string, "red" | "amber" | "blue"> = {
  grammar: "red",
  vocabulary: "amber",
  style: "blue",
};
const catLabel: Record<string, string> = {
  grammar: "Grammar",
  vocabulary: "Vocabulary",
  style: "Style",
};

type Phase = "ready" | "loading" | "quiz" | "results";
type Answer = { qId: number; chosen: number; correct: boolean };

// Seconds allotted per question when timed mode is enabled.
const QUESTION_TIME_SEC = 30;
// How long to show the "time's up" state before auto-advancing.
const TIMEOUT_ADVANCE_DELAY_MS = 1200;

export function QuizScreen({
  generateQuiz,
  recordAttempt,
  attempts,
  bestPct,
}: {
  generateQuiz: () => Promise<QuizPayload>;
  recordAttempt: (
    quizId: string,
    score: number,
    total: number,
    answers: unknown,
  ) => Promise<void>;
  attempts: number;
  bestPct: number;
}) {
  const router = useRouter();
  const [phase, setPhase] = React.useState<Phase>("ready");
  const [questions, setQuestions] = React.useState<QuizQuestion[]>([]);
  const [quizId, setQuizId] = React.useState<string | null>(null);
  const [qIdx, setQIdx] = React.useState(0);
  const [selected, setSelected] = React.useState<number | null>(null);
  const [answered, setAnswered] = React.useState(false);
  const [answers, setAnswers] = React.useState<Answer[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [timedMode, setTimedMode] = React.useState(false);
  const [timeLeft, setTimeLeft] = React.useState(QUESTION_TIME_SEC);
  const [timedOut, setTimedOut] = React.useState(false);
  const recordedRef = React.useRef(false);

  const totalQ = questions.length;
  const score = answers.filter((a) => a.correct).length;

  async function handleStart() {
    setPhase("loading");
    setError(null);
    try {
      const payload = await generateQuiz();
      setQuestions(payload.questions);
      setQuizId(payload.quizId);
      setQIdx(0);
      setSelected(null);
      setAnswered(false);
      setAnswers([]);
      setTimeLeft(QUESTION_TIME_SEC);
      setTimedOut(false);
      recordedRef.current = false;
      setPhase("quiz");
    } catch {
      setError("Could not generate a quiz. Please try again.");
      setPhase("ready");
    }
  }

  function handleSelect(i: number) {
    if (answered) return;
    const q = questions[qIdx];
    setSelected(i);
    setAnswered(true);
    setAnswers((prev) => [...prev, { qId: qIdx, chosen: i, correct: i === q.answer }]);
  }

  // Timeout is treated the same as a wrong/no answer: recorded with chosen -1
  // so recordAttempt sees a consistent shape whether the run was timed or not.
  function handleTimeout() {
    if (answered) return;
    setAnswered(true);
    setTimedOut(true);
    setAnswers((prev) => [...prev, { qId: qIdx, chosen: -1, correct: false }]);
  }

  function handleNext() {
    if (qIdx + 1 >= totalQ) setPhase("results");
    else {
      setQIdx((i) => i + 1);
      setSelected(null);
      setAnswered(false);
      setTimedOut(false);
      setTimeLeft(QUESTION_TIME_SEC);
    }
  }

  // Countdown ticker — only runs in timed mode, during the quiz, while the
  // current question is still unanswered.
  React.useEffect(() => {
    if (phase !== "quiz" || !timedMode || answered) return;
    if (timeLeft <= 0) {
      const t = setTimeout(() => handleTimeout(), 0);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, timedMode, answered, timeLeft, qIdx]);

  // After a timeout, auto-advance to the next question so the quiz never
  // gets stuck waiting for a click that isn't coming.
  React.useEffect(() => {
    if (!timedOut) return;
    const t = setTimeout(() => handleNext(), TIMEOUT_ADVANCE_DELAY_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timedOut]);

  // Persist the attempt once when results are shown.
  React.useEffect(() => {
    if (phase === "results" && quizId && !recordedRef.current) {
      recordedRef.current = true;
      recordAttempt(quizId, score, totalQ, answers).catch(() => {});
    }
  }, [phase, quizId, score, totalQ, answers, recordAttempt]);

  // ── Ready ──────────────────────────────────────────────────────────────────
  if (phase === "ready" || phase === "loading") {
    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "28px 32px 0", flexShrink: 0 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-.5px", color: "var(--t1)", lineHeight: 1.2 }}>
            Quiz &amp; Progress
          </h1>
          <p style={{ color: "var(--t3)", fontSize: 14, marginTop: 4 }}>
            Test your grammar, vocabulary &amp; style knowledge
          </p>
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 32 }}>
          <div
            style={{
              maxWidth: 460,
              width: "100%",
              background: "var(--surface)",
              borderRadius: "var(--r5)",
              border: "1px solid var(--bord2)",
              boxShadow: "var(--sh2)",
              padding: "40px 36px",
              textAlign: "center",
            }}
          >
            <div style={{ width: 64, height: 64, borderRadius: "var(--r5)", background: "var(--amber-ll)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
              {phase === "loading" ? (
                <Spinner size={30} color="var(--amber-d)" />
              ) : (
                <Icon name="trophy" size={30} color="var(--amber-d)" />
              )}
            </div>
            <p style={{ fontSize: 20, fontWeight: 800, color: "var(--t1)", marginBottom: 6 }}>
              {phase === "loading" ? "Generating your quiz…" : "Ready for a quiz?"}
            </p>
            <p style={{ fontSize: 13, color: "var(--t3)", marginBottom: 22 }}>
              {phase === "loading"
                ? "Tailoring questions to your vocabulary and recent mistakes."
                : "5 personalized questions from your vocabulary and recent corrections."}
            </p>
            {phase === "ready" && (
              <>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    padding: "12px 14px",
                    background: "var(--surf2)",
                    borderRadius: "var(--r3)",
                    marginBottom: 18,
                    textAlign: "left",
                  }}
                >
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "var(--t1)" }}>Timed mode</p>
                    <p style={{ fontSize: 11, color: "var(--t3)" }}>
                      {QUESTION_TIME_SEC}s countdown per question
                    </p>
                  </div>
                  <Toggle value={timedMode} onChange={setTimedMode} aria-label="Timed mode" />
                </div>
                <Button variant="primary" size="md" icon="sparkles" onClick={handleStart} full>
                  Generate Quiz
                </Button>
                {(attempts > 0 || bestPct > 0) && (
                  <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 22 }}>
                    <div>
                      <p style={{ fontSize: 20, fontWeight: 800, color: "var(--t1)" }}>{attempts}</p>
                      <p style={{ fontSize: 12, color: "var(--t3)" }}>Attempts</p>
                    </div>
                    <div style={{ width: 1, background: "var(--bord2)" }} />
                    <div>
                      <p style={{ fontSize: 20, fontWeight: 800, color: "var(--green)" }}>{bestPct}%</p>
                      <p style={{ fontSize: 12, color: "var(--t3)" }}>Best score</p>
                    </div>
                  </div>
                )}
                {error && <p style={{ fontSize: 12, color: "var(--red)", marginTop: 14 }}>{error}</p>}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Results ────────────────────────────────────────────────────────────────
  if (phase === "results") {
    const pct = totalQ ? Math.round((score / totalQ) * 100) : 0;
    const grade = pct >= 80 ? "Excellent!" : pct >= 60 ? "Good Job!" : "Keep Practicing!";
    const gradeColor = pct >= 80 ? "var(--green)" : pct >= 60 ? "var(--amber-d)" : "var(--red)";

    return (
      <div style={{ height: "100%", overflowY: "auto" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "40px 32px" }}>
          <div
            className="a-bounce"
            style={{
              background: "var(--surface)",
              borderRadius: "var(--r5)",
              border: "2px solid var(--bord2)",
              padding: "44px",
              textAlign: "center",
              boxShadow: "var(--sh2)",
              marginBottom: 24,
            }}
          >
            <div style={{ width: 80, height: 80, borderRadius: "50%", background: "var(--amber-ll)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <Icon name="award" size={38} color="var(--amber-d)" />
            </div>
            <p style={{ fontSize: 15, color: "var(--t3)", marginBottom: 4 }}>Quiz Complete</p>
            <p style={{ fontSize: 40, fontWeight: 800, color: gradeColor, letterSpacing: "-1px", lineHeight: 1 }}>{pct}%</p>
            <p style={{ fontSize: 24, fontWeight: 700, color: "var(--t1)", marginTop: 8, marginBottom: 4 }}>{grade}</p>
            <p style={{ color: "var(--t3)", fontSize: 14 }}>
              You got {score} out of {totalQ} questions correct
            </p>

            <div style={{ display: "flex", justifyContent: "center", gap: 24, margin: "28px 0", padding: "20px", background: "var(--surf2)", borderRadius: "var(--r4)" }}>
              {(["grammar", "vocabulary", "style"] as const).map((cat) => {
                const catQs = questions.filter((q) => q.category === cat);
                const catCorrect = answers.filter(
                  (a) => catQs.includes(questions[a.qId]) && a.correct,
                ).length;
                return (
                  <div key={cat} style={{ textAlign: "center" }}>
                    <p style={{ fontSize: 22, fontWeight: 800, color: `var(--${catColor[cat] === "amber" ? "amber-d" : catColor[cat]})` }}>
                      {catCorrect}/{catQs.length}
                    </p>
                    <p style={{ fontSize: 11, color: "var(--t3)", marginTop: 2, textTransform: "capitalize" }}>{cat}</p>
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <Button variant="secondary" size="md" icon="book" onClick={() => router.push("/flashcards")}>
                Study Flashcards
              </Button>
              <Button variant="primary" size="md" icon="refresh" onClick={handleStart}>
                New Quiz
              </Button>
            </div>
          </div>

          {/* Review answers */}
          <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 12, color: "var(--t1)" }}>Review Answers</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {questions.map((question, i) => {
              const ans = answers.find((a) => a.qId === i);
              if (!ans) return null;
              return (
                <div
                  key={i}
                  style={{
                    background: "var(--surface)",
                    borderRadius: "var(--r4)",
                    border: `1.5px solid ${ans.correct ? "var(--green-ll)" : "var(--red-ll)"}`,
                    padding: "14px 16px",
                  }}
                >
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <div style={{ width: 24, height: 24, borderRadius: "50%", flexShrink: 0, background: ans.correct ? "var(--green-l)" : "var(--red-l)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon name={ans.correct ? "check" : "x"} size={12} color={ans.correct ? "var(--green)" : "var(--red)"} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "var(--t1)", marginBottom: 4 }}>
                        Q{i + 1}: {question.q}
                      </p>
                      <p style={{ fontSize: 12, color: ans.correct ? "var(--green)" : "var(--red)", marginBottom: ans.correct ? 0 : 3 }}>
                        {ans.correct
                          ? `Correct: ${question.opts[question.answer]}`
                          : ans.chosen === -1
                            ? "Your answer: (no answer — time ran out)"
                            : `Your answer: ${question.opts[ans.chosen]}`}
                      </p>
                      {!ans.correct && (
                        <p style={{ fontSize: 12, color: "var(--green)" }}>
                          Correct: {question.opts[question.answer]}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── Quiz (in progress) ──────────────────────────────────────────────────────
  const q = questions[qIdx];
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ padding: "28px 32px 20px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-.5px", color: "var(--t1)", lineHeight: 1.2 }}>
              Quiz &amp; Progress
            </h1>
            <p style={{ color: "var(--t3)", fontSize: 14, marginTop: 4 }}>
              Test your grammar, vocabulary &amp; style knowledge
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {timedMode && (
              <Badge color={timeLeft <= 10 ? "red" : "blue"} icon="zap">
                {timedOut ? "Time's up!" : `${timeLeft}s`}
              </Badge>
            )}
            <Badge color="amber">
              Question {qIdx + 1} / {totalQ}
            </Badge>
            <Badge color="green" icon="check">
              {score} correct
            </Badge>
          </div>
        </div>
        <ProgressBar value={qIdx} max={totalQ} height={6} />
      </div>

      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "0 32px 32px" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <div
            key={qIdx}
            className="a-up"
            style={{
              background: "var(--surface)",
              borderRadius: "var(--r5)",
              border: "1px solid var(--bord2)",
              padding: "32px",
              boxShadow: "var(--sh2)",
              marginBottom: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
              <Badge color={catColor[q.category]}>{catLabel[q.category]}</Badge>
              <span style={{ fontSize: 12, color: "var(--t3)" }}>· {q.rule}</span>
            </div>
            <p style={{ fontSize: 18, fontWeight: 700, color: "var(--t1)", lineHeight: 1.5, marginBottom: 24 }}>{q.q}</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {q.opts.map((opt, i) => {
                const isSelected = selected === i;
                const isCorrect = i === q.answer;
                let bg = "var(--surface)";
                let bc = "var(--border)";
                let color = "var(--t1)";
                if (answered) {
                  if (isCorrect) {
                    bg = "var(--green-l)";
                    bc = "var(--green)";
                    color = "var(--green)";
                  } else if (isSelected) {
                    bg = "var(--red-l)";
                    bc = "var(--red)";
                    color = "var(--red)";
                  }
                }
                if (!answered && isSelected) {
                  bg = "var(--amber-ll)";
                  bc = "var(--amber)";
                }
                return (
                  <button
                    key={i}
                    onClick={() => handleSelect(i)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      padding: "14px 18px",
                      borderRadius: "var(--r3)",
                      border: `1.5px solid ${bc}`,
                      background: bg,
                      cursor: answered ? "default" : "pointer",
                      textAlign: "left",
                      transition: "all var(--fast)",
                      fontFamily: "var(--font)",
                    }}
                  >
                    <span
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: answered && isCorrect ? "var(--green)" : answered && isSelected ? "var(--red)" : "var(--bord2)",
                        color: answered && (isCorrect || isSelected) ? "#fff" : "var(--t2)",
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {answered && isCorrect ? (
                        <Icon name="check" size={13} color="#fff" />
                      ) : answered && isSelected ? (
                        <Icon name="x" size={13} color="#fff" />
                      ) : (
                        String.fromCharCode(65 + i)
                      )}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 500, color, flex: 1, lineHeight: 1.45 }}>{opt}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {answered && (
            <div
              className="a-up"
              style={{
                background: selected === q.answer ? "var(--green-l)" : "var(--red-l)",
                border: `1.5px solid ${selected === q.answer ? "var(--green-ll)" : "var(--red-ll)"}`,
                borderRadius: "var(--r4)",
                padding: "18px 20px",
                marginBottom: 16,
              }}
            >
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, background: selected === q.answer ? "var(--green)" : "var(--red)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name={selected === q.answer ? "check" : "info"} size={14} color="#fff" />
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 13, color: "var(--t1)", marginBottom: 4 }}>
                    {timedOut
                      ? "Time's up — here's why:"
                      : selected === q.answer
                        ? "Correct!"
                        : "Not quite — here's why:"}
                  </p>
                  <p style={{ fontSize: 13, color: "var(--t2)", lineHeight: 1.6 }}>{q.expl}</p>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            {!answered ? (
              <Button variant="secondary" size="md" disabled>
                Select an answer to continue
              </Button>
            ) : (
              <Button variant="primary" size="md" iconRight="chev-r" onClick={handleNext}>
                {qIdx + 1 < totalQ ? "Next Question" : "See Results"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
