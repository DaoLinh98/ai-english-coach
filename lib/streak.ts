/** Local calendar day key (YYYY-MM-DD) for a timestamp, used to dedupe activity by day. */
export function dayKey(iso: string | Date): string {
  return new Date(iso).toLocaleDateString("en-CA");
}

/**
 * Count consecutive days of activity ending today (or yesterday, if there's
 * no activity yet today — so the streak doesn't reset to 0 first thing in
 * the morning before the user has had a chance to study).
 */
export function computeStreak(activityDates: (string | Date)[]): number {
  if (!activityDates.length) return 0;
  const days = new Set(activityDates.map(dayKey));
  const cursor = new Date();
  if (!days.has(dayKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!days.has(dayKey(cursor))) return 0;
  }
  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** Whether any activity timestamp falls on today's local calendar day. */
export function hasActivityToday(activityDates: (string | Date)[]): boolean {
  const today = dayKey(new Date());
  return activityDates.some((d) => dayKey(d) === today);
}
