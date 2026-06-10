"use server";

import { getAiProvider } from "@/lib/ai";
import type {
  CorrectContext,
  CorrectLevel,
  CorrectionResult,
  CorrectTone,
} from "@/lib/ai";
import { createClient } from "@/lib/supabase/server";

export type SuggestNextInput = {
  text: string;
  context: CorrectContext;
  tone: CorrectTone;
  level: CorrectLevel;
};

/**
 * Server Action: propose 2-3 next sentences that continue the user's draft.
 * Anonymous-friendly (no persistence); the Gemini key stays server-side.
 */
export async function suggestNext(
  input: SuggestNextInput,
): Promise<string[]> {
  const text = input.text?.trim();
  if (!text) return [];
  const ai = getAiProvider();
  const result = await ai.suggestContinuation({
    text,
    context: input.context,
    tone: input.tone,
    level: input.level,
  });
  return result.suggestions;
}

export type AnalyzeInput = {
  text: string;
  context: CorrectContext;
  tone: CorrectTone;
  level: CorrectLevel;
};

/**
 * Server Action: run the AI correction engine over the user's text.
 * Runs server-side only (the Gemini key never reaches the client).
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
      const { data } = await supabase
        .from("preferred_vocabulary")
        .select("term")
        .eq("user_id", user.id);
      preferredVocab = (data ?? []).map((v: { term: string }) => v.term);
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
      const { data: hist } = await supabase
        .from("correction_history")
        .insert({
          user_id: user.id,
          context: input.context,
          tone: input.tone,
          level: input.level,
          input_text: text,
          output_text: result.correctedText,
        })
        .select("id")
        .single();

      if (hist && result.items.length) {
        await supabase.from("correction_items").insert(
          result.items.map((it) => ({
            history_id: hist.id,
            type: it.type,
            find: it.find,
            suggest: it.suggest,
            label: it.label,
            expl: it.expl,
            rule: it.rule,
          })),
        );
      }
    } catch {
      // best-effort persistence
    }
  }

  return result;
}
