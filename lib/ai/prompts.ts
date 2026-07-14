import type {
  CorrectContext,
  CorrectTextInput,
  CorrectTone,
  CorrectLevel,
  GenerateFlashcardInput,
  GenerateQuizInput,
  SuggestContinuationInput,
} from "./provider";

/**
 * Prompt templates shared by every AiProvider implementation (Gemini,
 * Ollama, ...) and by the standalone routes that call a model directly
 * without going through AiProvider. Keeping them here means adding a new
 * provider is just a new HTTP client, not a re-write of every prompt.
 */

export const CONTEXT_GUIDE: Record<CorrectContext, string> = {
  email: "a professional or semi-formal work email",
  slack: "a casual Slack/chat message that still reads clearly and professionally",
  jira: "a Jira ticket or technical documentation — concise, well-structured, scannable",
  notes: "meeting notes or a summary — standardised, with key points kept clear",
};

export const TONE_GUIDE: Record<CorrectTone, string> = {
  professional: "polished, professional, and businesslike",
  casual: "relaxed and friendly while remaining clear",
  persuasive: "confident and persuasive",
};

export const LEVEL_GUIDE: Record<CorrectLevel, string> = {
  beginner: "Keep suggestions simple; prefer common words and short sentences.",
  intermediate: "Use natural, idiomatic professional English.",
  advanced: "You may use precise, sophisticated vocabulary and varied structure.",
};

export function buildCorrectionPrompt(input: CorrectTextInput): string {
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

export function buildFlashcardPrompt(input: GenerateFlashcardInput): string {
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
  "synonyms": string[],  // 3-4 synonyms or close alternatives
  "phonetic": string     // IPA transcription, e.g. /dɪˈplɔɪmənt/ — include the slashes
}`;
}

export function buildFlashcardBatchPrompt(words: string[]): string {
  const list = words.map((w) => `"${w}"`).join(", ");
  return `Create English vocabulary flashcards for each of these words/phrases: ${list}.

Return ONLY a JSON object (no markdown) with this exact shape:
{
  "cards": [
    {
      "word": string,        // the headword, cleaned up — must match one of the input words
      "pos": string,         // part of speech, e.g. "verb", "noun", "adjective"
      "level": "beginner" | "intermediate" | "advanced",
      "context": string,     // one topical tag: "Technical", "Business", "Writing", or "General"
      "def": string,         // a clear, concise definition
      "example": string,     // one natural example sentence for a tech/office professional
      "synonyms": string[],  // 3-4 synonyms or close alternatives
      "phonetic": string     // IPA transcription, e.g. /dɪˈplɔɪmənt/ — include the slashes
    }
  ]
}

Provide exactly one card per input word, in the same order. If a word/phrase is not a real, useful vocabulary item (e.g. a meaningless word pair), omit it from "cards" instead of inventing a definition.`;
}

export function buildQuizPrompt(input: GenerateQuizInput): string {
  const count = input.count ?? 5;
  const vocab = input.vocab?.length
    ? `\nFavour these vocabulary words the learner is studying: ${input.vocab.slice(0, 12).join(", ")}.`
    : "";
  const mistakes = input.mistakes?.length
    ? `\nTarget these recent mistakes the learner made (shown as wrong → right): ${input.mistakes.slice(0, 12).join("; ")}.`
    : "";

  return `Create a ${count}-question multiple-choice English quiz for a software/office professional.
Mix the categories grammar, vocabulary, and style.${vocab}${mistakes}

Return ONLY a JSON object (no markdown) with this exact shape:
{
  "questions": [
    {
      "category": "grammar" | "vocabulary" | "style",
      "q": string,                 // the question
      "opts": [string, string, string, string],  // exactly 4 options
      "answer": number,            // index (0-3) of the correct option
      "expl": string,              // why the answer is correct
      "rule": string               // the rule/skill name
    }
  ]
}
Provide exactly ${count} questions, each with exactly 4 options and one correct answer.`;
}

export function buildContinuationPrompt(input: SuggestContinuationInput): string {
  return `You are an English writing assistant helping a software/office professional continue their draft for ${CONTEXT_GUIDE[input.context]}. The tone should be ${TONE_GUIDE[input.tone]}. ${LEVEL_GUIDE[input.level]}

Read the draft below and propose 2-3 natural next sentences that could come right after it. Each suggestion must be a complete, standalone sentence that flows from the existing text — do NOT rewrite or repeat what is already written.

Return ONLY a JSON object (no markdown) with this exact shape:
{
  "suggestions": [string, string, string]   // 2-3 candidate next sentences
}

DRAFT SO FAR:
"""
${input.text}
"""`;
}

export function buildChangeExplanationPrompt(original: string, corrected: string): string {
  return `You are an expert English writing coach. Compare the ORIGINAL text (written by a non-native English speaker, possibly mixed with Vietnamese) with the CORRECTED text (translated and fixed).

Identify up to 6 of the most notable/instructive corrections (grammar, style, or word choice) and explain each one so the learner understands the rule involved.

Return ONLY a JSON object (no markdown, no commentary) with this exact shape:
{
  "items": [
    {
      "text": string,   // an EXACT, verbatim substring of the CORRECTED text that this explanation refers to (must appear in the corrected text)
      "label": string,  // short issue name, e.g. "Subject-verb agreement"
      "expl": string,   // one or two sentences explaining the rule and why the correction was made
      "rule": string    // the rule name, e.g. "Passive Voice"
    }
  ]
}

If there are no instructive corrections to explain, return { "items": [] }.

ORIGINAL:
"""
${original}
"""

CORRECTED:
"""
${corrected}
"""`;
}

export function buildTranslateToEnglishPrompt(text: string): string {
  return `You are an expert English editor working with software developers.

The user has written text that may be a mix of Vietnamese and English. Your tasks:
1. Translate any Vietnamese portions into English
2. Fix all grammar, spelling, punctuation, and sentence structure
3. Use concise, tech-oriented professional English — direct, on-point, no filler words
4. Preserve technical terms (API, PR, deploy, refactor, etc.) exactly as written

Return ONLY the corrected English text. No explanation, no commentary — just the final text.

TEXT:
"""
${text}
"""`;
}

const TRANSLATE_SOURCE_GUIDE: Record<string, string> = {
  message: "a direct message or chat message from a client or colleague",
  comment: "a code review comment or inline feedback",
  ticket: "a Jira ticket, issue description, or task card",
  document: "a technical document, specification, or report",
};

export function buildTranslateToVietnamesePrompt(text: string, source: string): string {
  const ctx = TRANSLATE_SOURCE_GUIDE[source] ?? TRANSLATE_SOURCE_GUIDE.message;
  return `You are a technical translator specializing in software development and IT communication.

Translate the following English text into natural Vietnamese. This text is ${ctx}.

Rules:
- Keep ALL technical terms in English exactly as written: API, PR, deploy, refactor, merge, sprint, backend, frontend, debug, framework, endpoint, repo, CI/CD, LGTM, etc.
- Keep code snippets, variable names, and URLs unchanged.
- Use natural, fluent Vietnamese — not robotic machine translation.
- Preserve the tone (professional stays professional, casual stays casual).
- Return ONLY the Vietnamese translation. No explanation, no original text, no commentary.

ENGLISH TEXT:
"""
${text}
"""`;
}

export function stripFences(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith("```")) {
    return trimmed
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();
  }
  return trimmed;
}
