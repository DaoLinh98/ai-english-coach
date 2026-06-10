import { describe, expect, it } from "vitest";
import { continuationSchema, correctionResultSchema } from "@/lib/ai/schema";

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

describe("continuationSchema", () => {
  it("parses 1-3 suggestions", () => {
    const parsed = continuationSchema.parse({
      suggestions: ["Let me know if that works.", "I'll follow up tomorrow."],
    });
    expect(parsed.suggestions).toHaveLength(2);
  });

  it("rejects an empty suggestion list", () => {
    expect(() => continuationSchema.parse({ suggestions: [] })).toThrow();
  });

  it("rejects more than 3 suggestions", () => {
    expect(() =>
      continuationSchema.parse({ suggestions: ["a", "b", "c", "d"] }),
    ).toThrow();
  });
});
