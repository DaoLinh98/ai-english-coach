"use server";

import { getAiProvider } from "@/lib/ai";
import type {
  CorrectContext,
  CorrectLevel,
  CorrectionResult,
  CorrectTone,
} from "@/lib/ai";

export type AnalyzeInput = {
  text: string;
  context: CorrectContext;
  tone: CorrectTone;
  level: CorrectLevel;
};

/**
 * Server Action: run the AI correction engine over the user's text.
 * Runs server-side only (the Gemini key never reaches the client).
 * Persistence of history is added in Wave 2.
 */
export async function analyzeText(
  input: AnalyzeInput,
): Promise<CorrectionResult> {
  const text = input.text?.trim();
  if (!text) return { correctedText: "", items: [] };

  const ai = getAiProvider();
  return ai.correctText({
    text,
    context: input.context,
    tone: input.tone,
    level: input.level,
  });
}
