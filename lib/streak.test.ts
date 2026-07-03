import { describe, expect, it } from "vitest";
import { computeStreak, hasActivityToday } from "@/lib/streak";

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

describe("computeStreak", () => {
  it("returns 0 for no activity", () => {
    expect(computeStreak([])).toBe(0);
  });

  it("counts consecutive days ending today", () => {
    expect(computeStreak([daysAgo(0), daysAgo(1), daysAgo(2)])).toBe(3);
  });

  it("still counts a streak if today has no activity yet but yesterday does", () => {
    expect(computeStreak([daysAgo(1), daysAgo(2)])).toBe(2);
  });

  it("stops at the first gap", () => {
    expect(computeStreak([daysAgo(0), daysAgo(1), daysAgo(3)])).toBe(2);
  });

  it("returns 0 if the most recent activity is more than a day old", () => {
    expect(computeStreak([daysAgo(3), daysAgo(4)])).toBe(0);
  });

  it("dedupes multiple activity timestamps on the same day", () => {
    const today = new Date();
    expect(computeStreak([today, new Date(today.getTime() + 1000)])).toBe(1);
  });
});

describe("hasActivityToday", () => {
  it("is true when a timestamp falls on today", () => {
    expect(hasActivityToday([daysAgo(0)])).toBe(true);
  });

  it("is false when there's no activity today", () => {
    expect(hasActivityToday([daysAgo(1)])).toBe(false);
  });

  it("is false for an empty list", () => {
    expect(hasActivityToday([])).toBe(false);
  });
});
