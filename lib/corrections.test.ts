import { describe, expect, it } from "vitest";
import { applyAccepted, locateCorrections } from "@/lib/corrections";
import type { CorrectionItem } from "@/lib/ai";

const item = (find: string, suggest: string): CorrectionItem => ({
  find,
  suggest,
  type: "grammar",
  label: "l",
  expl: "e",
  rule: "r",
});

describe("locateCorrections", () => {
  it("assigns offsets and ids in order", () => {
    const text = "We faces issues quick.";
    const located = locateCorrections(text, [
      item("issues quick", "issues quickly"),
      item("We faces", "We faced"),
    ]);
    expect(located.map((c) => c.find)).toEqual(["We faces", "issues quick"]);
    expect(text.slice(located[0].start, located[0].end)).toBe("We faces");
  });

  it("drops corrections whose find is absent", () => {
    const located = locateCorrections("hello world", [item("xyz", "abc")]);
    expect(located).toHaveLength(0);
  });

  it("resolves duplicate finds to distinct occurrences", () => {
    const located = locateCorrections("the the the", [
      item("the", "a"),
      item("the", "a"),
    ]);
    expect(located).toHaveLength(2);
    expect(located[0].start).not.toBe(located[1].start);
  });
});

describe("applyAccepted", () => {
  it("applies only accepted suggestions", () => {
    const text = "We faces issues quick.";
    const located = locateCorrections(text, [
      item("We faces", "We faced"),
      item("issues quick", "issues quickly"),
    ]);
    const accepted = new Set([located[0].id]);
    expect(applyAccepted(text, located, accepted)).toBe(
      "We faced issues quick.",
    );
  });
});
