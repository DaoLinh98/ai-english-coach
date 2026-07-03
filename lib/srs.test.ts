import { describe, expect, it } from "vitest";
import { isDue, reviewCard, type SrsState } from "@/lib/srs";

const fresh: SrsState = { easeFactor: 2.5, intervalDays: 0, reviewCount: 0 };
const now = new Date("2026-01-01T00:00:00Z");

describe("reviewCard", () => {
  it("schedules the first successful review 1 day out", () => {
    const next = reviewCard(fresh, "good", now);
    expect(next.intervalDays).toBe(1);
    expect(next.reviewCount).toBe(1);
    expect(next.dueDate).toBe("2026-01-02");
  });

  it("schedules the second successful review 6 days out", () => {
    const first = reviewCard(fresh, "good", now);
    const second = reviewCard(first, "good", now);
    expect(second.intervalDays).toBe(6);
    expect(second.reviewCount).toBe(2);
  });

  it("multiplies interval by ease factor from the third review onward", () => {
    let state = reviewCard(fresh, "good", now);
    state = reviewCard(state, "good", now);
    const third = reviewCard(state, "good", now);
    expect(third.intervalDays).toBe(Math.round(6 * state.easeFactor));
  });

  it("resets interval and review count on a failed recall (again)", () => {
    let state = reviewCard(fresh, "good", now);
    state = reviewCard(state, "good", now);
    const failed = reviewCard(state, "again", now);
    expect(failed.intervalDays).toBe(1);
    expect(failed.reviewCount).toBe(0);
  });

  it("never lets ease factor drop below 1.3", () => {
    let state: SrsState = fresh;
    for (let i = 0; i < 20; i++) {
      state = reviewCard(state, "again", now);
    }
    expect(state.easeFactor).toBeGreaterThanOrEqual(1.3);
  });

  it("increases ease factor on easy grades", () => {
    const next = reviewCard(fresh, "easy", now);
    expect(next.easeFactor).toBeGreaterThan(fresh.easeFactor);
  });

  it("decreases ease factor on hard grades", () => {
    const next = reviewCard(fresh, "hard", now);
    expect(next.easeFactor).toBeLessThan(fresh.easeFactor);
  });
});

describe("isDue", () => {
  it("is true when due date is today or earlier", () => {
    expect(isDue("2026-01-01", now)).toBe(true);
    expect(isDue("2025-12-31", now)).toBe(true);
  });

  it("is false when due date is in the future", () => {
    expect(isDue("2026-01-02", now)).toBe(false);
  });
});
