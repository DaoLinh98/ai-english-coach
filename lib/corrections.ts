import type { CorrectionItem } from "@/lib/ai";

/** A correction with its located character offsets in the analyzed text. */
export type LocatedCorrection = CorrectionItem & {
  id: number;
  start: number;
  end: number;
};

/**
 * Locate each correction's `find` substring within the original text and
 * assign character offsets + a stable id. Items whose `find` cannot be found
 * are dropped; overlapping matches are skipped so highlights never collide.
 * Duplicate `find` values resolve to distinct, non-overlapping occurrences.
 */
export function locateCorrections(
  text: string,
  items: CorrectionItem[],
): LocatedCorrection[] {
  const used: Array<[number, number]> = [];
  const out: LocatedCorrection[] = [];
  let id = 1;

  for (const it of items) {
    if (!it.find) continue;
    let idx = text.indexOf(it.find);
    while (idx !== -1) {
      const end = idx + it.find.length;
      const overlaps = used.some(([s, e]) => idx < e && end > s);
      if (!overlaps) {
        used.push([idx, end]);
        out.push({ ...it, id: id++, start: idx, end });
        break;
      }
      idx = text.indexOf(it.find, idx + 1);
    }
  }

  return out.sort((a, b) => a.start - b.start);
}

/** Apply the accepted suggestions to the original text (right-to-left). */
export function applyAccepted(
  text: string,
  corrections: LocatedCorrection[],
  accepted: Set<number>,
): string {
  let result = text;
  const sorted = [...corrections].sort((a, b) => b.start - a.start);
  for (const c of sorted) {
    if (accepted.has(c.id)) {
      result = result.slice(0, c.start) + c.suggest + result.slice(c.end);
    }
  }
  return result;
}
