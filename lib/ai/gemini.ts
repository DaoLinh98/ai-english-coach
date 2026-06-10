import { GoogleGenAI } from "@google/genai";
import { correctionResultSchema, generatedFlashcardSchema } from "./schema";
import type {
  AiProvider,
  CorrectContext,
  CorrectLevel,
  CorrectTextInput,
  CorrectTone,
  GenerateFlashcardInput,
} from "./provider";

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const CONTEXT_GUIDE: Record<CorrectContext, string> = {
  email: "a professional or semi-formal work email",
  slack: "a casual Slack/chat message that still reads clearly and professionally",
  jira: "a Jira ticket or technical documentation — concise, well-structured, scannable",
  notes: "meeting notes or a summary — standardised, with key points kept clear",
};

const TONE_GUIDE: Record<CorrectTone, string> = {
  professional: "polished, professional, and businesslike",
  casual: "relaxed and friendly while remaining clear",
  persuasive: "confident and persuasive",
};

const LEVEL_GUIDE: Record<CorrectLevel, string> = {
  beginner: "Keep suggestions simple; prefer common words and short sentences.",
  intermediate: "Use natural, idiomatic professional English.",
  advanced: "You may use precise, sophisticated vocabulary and varied structure.",
};

function buildPrompt(input: CorrectTextInput): string {
  const { text, context, tone, level, preferredVocab } = input;
  const vocab =
    preferredVocab && preferredVocab.length
      ? `\nThe user prefers these words/phrases where they fit naturally: ${preferredVocab.join(", ")}.`
      : "";

  return `You are an expert English writing coach for software developers, project managers, and office professionals.

Improve the following text written for ${CONTEXT_GUIDE[context]}. The desired tone is ${TONE_GUIDE[tone]}. ${LEVEL_GUIDE[level]}${vocab}

Correct grammar, spelling, and punctuation; enhance weak or repetitive vocabulary; and tighten sentence structure for clarity and flow. Adapt to IT / software-development / office communication conventions.

Return ONLY a JSON object (no markdown, no commentary) with this exact shape:
{
  "correctedText": string,            // the full text with every suggested change applied
  "items": [
    {
      "find": string,                 // an EXACT, verbatim substring of the ORIGINAL text to replace (must appear in the original)
      "suggest": string,              // the replacement
      "type": "grammar" | "style" | "vocab",
      "label": string,                // short issue name, e.g. "Subject-verb agreement"
      "expl": string,                 // one or two sentences explaining why
      "rule": string                  // the rule name, e.g. "Passive Voice"
    }
  ]
}

Rules:
- Every "find" MUST be copied verbatim from the original text so it can be located; do not paraphrase it.
- Use "grammar" for grammar/spelling/punctuation, "style" for structure/clarity/conciseness, "vocab" for word-choice upgrades.
- If the text is already correct, return it unchanged with an empty "items" array.

ORIGINAL TEXT:
"""
${text}
"""`;
}

function buildFlashcardPrompt(input: GenerateFlashcardInput): string {
  const ctx = input.context ? ` It is used in this context: "${input.context}".` : "";
  return `Create an English vocabulary flashcard for the word or phrase: "${input.word}".${ctx}

Return ONLY a JSON object (no markdown) with this exact shape:
{
  "word": string,        // the headword, cleaned up
  "pos": string,         // part of speech, e.g. "verb", "noun", "adjective"
  "level": "beginner" | "intermediate" | "advanced",
  "context": string,     // one topical tag: "Technical", "Business", "Writing", or "General"
  "def": string,         // a clear, concise definition
  "example": string,     // one natural example sentence for a tech/office professional
  "synonyms": string[]   // 3-4 synonyms or close alternatives
}`;
}

function stripFences(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith("```")) {
    return trimmed
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();
  }
  return trimmed;
}

export function createGeminiProvider(): AiProvider {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }
  const ai = new GoogleGenAI({ apiKey });

  return {
    async correctText(input: CorrectTextInput) {
      const response = await ai.models.generateContent({
        model: MODEL,
        contents: buildPrompt(input),
        config: {
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      });
      const raw = response.text ?? "";
      let parsed: unknown;
      try {
        parsed = JSON.parse(stripFences(raw));
      } catch {
        throw new Error("AI returned a non-JSON response");
      }
      return correctionResultSchema.parse(parsed);
    },

    async generateFlashcard(input: GenerateFlashcardInput) {
      const response = await ai.models.generateContent({
        model: MODEL,
        contents: buildFlashcardPrompt(input),
        config: { responseMimeType: "application/json", temperature: 0.3 },
      });
      const raw = response.text ?? "";
      let parsed: unknown;
      try {
        parsed = JSON.parse(stripFences(raw));
      } catch {
        throw new Error("AI returned a non-JSON response");
      }
      return generatedFlashcardSchema.parse(parsed);
    },
  };
}
