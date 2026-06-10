import { describe, expect, it } from "vitest";
import {
  buildCorrectionMarkdown,
  buildFlashcardsMarkdown,
  type ExportableFlashcard,
} from "@/lib/export";
import type { LocatedCorrection } from "@/lib/corrections";

const corr = (over: Partial<LocatedCorrection>): LocatedCorrection => ({
  id: 0,
  find: "faces",
  suggest: "faced",
  type: "grammar",
  label: "Subject-verb agreement",
  expl: "Past tense is required.",
  rule: "Verb tense",
  start: 0,
  end: 5,
  ...over,
});

describe("buildCorrectionMarkdown", () => {
  it("includes the corrected text and a numbered explanation per correction", () => {
    const md = buildCorrectionMarkdown("We faced issues.", [
      corr({ id: 0 }),
      corr({ id: 1, label: "Wordiness", type: "style", find: "issues", suggest: "blockers" }),
    ]);
    expect(md).toContain("We faced issues.");
    expect(md).toContain("## Explanations");
    expect(md).toContain("### 1. Subject-verb agreement (Grammar)");
    expect(md).toContain("### 2. Wordiness (Style)");
    expect(md).toContain("`faces` → `faced`");
  });

  it("omits the explanations section when there are no corrections", () => {
    const md = buildCorrectionMarkdown("All good.", []);
    expect(md).toContain("All good.");
    expect(md).not.toContain("## Explanations");
  });
});

describe("buildFlashcardsMarkdown", () => {
  it("renders each card with its fields and a learned marker", () => {
    const cards: ExportableFlashcard[] = [
      {
        word: "leverage",
        pos: "verb",
        level: "intermediate",
        context: "Business",
        def: "to use to maximum advantage",
        example: "We leverage caching to cut latency.",
        synonyms: ["use", "exploit"],
        learned: true,
      },
    ];
    const md = buildFlashcardsMarkdown(cards);
    expect(md).toContain("1 card exported");
    expect(md).toContain("## leverage ✓");
    expect(md).toContain("**Synonyms:** use, exploit");
  });
});
