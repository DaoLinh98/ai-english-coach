"use server";

import { getAiProvider } from "@/lib/ai";
import type {
  CorrectContext,
  CorrectLevel,
  CorrectionResult,
  CorrectTone,
} from "@/lib/ai";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export type AnalyzeInput = {
  text: string;
  context: CorrectContext;
  tone: CorrectTone;
  level: CorrectLevel;
};

/**
 * Server Action: run the AI correction engine over the user's text.
 * Runs server-side only (the AI provider is never reached from the client).
 *
 * When the user is signed in, their preferred vocabulary is fed to the model
 * and the result is persisted to correction_history + correction_items
 * (best-effort — persistence failures never block the correction).
 */
export async function analyzeText(
  input: AnalyzeInput,
): Promise<CorrectionResult> {
  const text = input.text?.trim();
  if (!text) return { correctedText: "", items: [] };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let preferredVocab: string[] | undefined;
  if (user) {
    try {
      const data = await prisma.preferredVocabulary.findMany({
        where: { userId: user.id },
        select: { term: true },
      });
      preferredVocab = data.map((v) => v.term);
    } catch {
      preferredVocab = undefined;
    }
  }

  const ai = getAiProvider();
  const result = await ai.correctText({
    text,
    context: input.context,
    tone: input.tone,
    level: input.level,
    preferredVocab,
  });

  if (user) {
    try {
      const hist = await prisma.correctionHistory.create({
        data: {
          userId: user.id,
          context: input.context,
          tone: input.tone,
          level: input.level,
          inputText: text,
          outputText: result.correctedText,
        },
        select: { id: true },
      });

      if (result.items.length) {
        await prisma.correctionItem.createMany({
          data: result.items.map((it) => ({
            historyId: hist.id,
            type: it.type,
            find: it.find,
            suggest: it.suggest,
            label: it.label,
            expl: it.expl,
            rule: it.rule,
          })),
        });
      }
    } catch {
      // best-effort persistence
    }
  }

  return result;
}
