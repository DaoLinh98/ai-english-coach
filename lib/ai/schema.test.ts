import { describe, expect, it } from "vitest";
import { correctionResultSchema } from "@/lib/ai/schema";

describe("correctionResultSchema", () => {
  it("parses a well-formed correction result", () => {
    const sample = {
      correctedText: "We faced some challenges.",
      items: [
        {
          find: "We faces",
          suggest: "We faced",
          type: "grammar",
          label: "Subject-verb agreement",
          expl: "Past tense of 'face' for the plural subject 'we'.",
          rule: "Subject-Verb Agreement",
        },
      ],
    };
    const parsed = correctionResultSchema.parse(sample);
    expect(parsed.items).toHaveLength(1);
    expect(parsed.items[0].type).toBe("grammar");
  });

  it("rejects an invalid correction type", () => {
    const bad = {
      correctedText: "x",
      items: [
        {
          find: "a",
          suggest: "b",
          type: "spelling",
          label: "l",
          expl: "e",
          rule: "r",
        },
      ],
    };
    expect(() => correctionResultSchema.parse(bad)).toThrow();
  });
});
