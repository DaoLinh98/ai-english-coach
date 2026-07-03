/**
 * SM-2 spaced-repetition scheduling (the algorithm behind SuperMemo/Anki).
 * Given a card's current scheduling state and a recall-quality grade, returns
 * the next ease factor, interval (days), and due date.
 */

export type SrsGrade = "again" | "hard" | "good" | "easy";

/** SM-2 quality scale (0-5); "again" maps below the 3-point pass threshold. */
const GRADE_QUALITY: Record<SrsGrade, number> = {
  again: 1,
  hard: 3,
  good: 4,
  easy: 5,
};

export type SrsState = {
  easeFactor: number;
  intervalDays: number;
  reviewCount: number;
};

export function reviewCard(state: SrsState, grade: SrsGrade, now: Date = new Date()): SrsState & { dueDate: string } {
  const quality = GRADE_QUALITY[grade];
  let { easeFactor, intervalDays, reviewCount } = state;

  // Ease factor update (SM-2), floored at 1.3 so it never spirals to zero.
  easeFactor = Math.max(1.3, easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));

  if (quality < 3) {
    // Failed recall: restart the interval, keep the (now-lower) ease factor.
    intervalDays = 1;
    reviewCount = 0;
  } else {
    reviewCount += 1;
    if (reviewCount === 1) intervalDays = 1;
    else if (reviewCount === 2) intervalDays = 6;
    else intervalDays = Math.round(intervalDays * easeFactor);
  }

  const due = new Date(now);
  due.setDate(due.getDate() + intervalDays);

  return {
    easeFactor: Math.round(easeFactor * 100) / 100,
    intervalDays,
    reviewCount,
    dueDate: due.toLocaleDateString("en-CA"),
  };
}

export function isDue(dueDate: string, now: Date = new Date()): boolean {
  return dueDate <= now.toLocaleDateString("en-CA");
}
