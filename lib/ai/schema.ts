import { z } from "zod";

/**
 * Structured output contracts for the AI layer. Every Gemini call returns
 * JSON validated against these schemas, so screens receive typed objects
 * (never free text). The editor's correction-item shape mirrors the
 * prototype's `CORR` records (minus start/end, which the client computes by
 * locating `find` within the original text).
 */

export const correctionTypeSchema = z.enum(["grammar", "style", "vocab"]);
export type CorrectionType = z.infer<typeof correctionTypeSchema>;

export const correctionItemSchema = z.object({
  /** Exact substring of the original text that should be replaced. */
  find: z.string().min(1),
  /** Replacement text. */
  suggest: z.string(),
  type: correctionTypeSchema,
  /** Short human label, e.g. "Subject-verb agreement". */
  label: z.string(),
  /** One- or two-sentence explanation of the correction. */
  expl: z.string(),
  /** The grammar/style rule name, e.g. "Passive Voice". */
  rule: z.string(),
});
export type CorrectionItem = z.infer<typeof correctionItemSchema>;

export const correctionResultSchema = z.object({
  correctedText: z.string(),
  items: z.array(correctionItemSchema),
});
export type CorrectionResult = z.infer<typeof correctionResultSchema>;

// ── Flashcard generation ────────────────────────────────────────────────────
export const flashcardLevelSchema = z.enum([
  "beginner",
  "intermediate",
  "advanced",
]);

export const generatedFlashcardSchema = z.object({
  word: z.string().min(1),
  pos: z.string(),
  level: flashcardLevelSchema,
  /** Topical tag, e.g. Technical | Business | Writing | General. */
  context: z.string(),
  def: z.string(),
  example: z.string(),
  synonyms: z.array(z.string()),
});
export type GeneratedFlashcard = z.infer<typeof generatedFlashcardSchema>;

// ── Quiz generation ─────────────────────────────────────────────────────────
export const quizCategorySchema = z.enum(["grammar", "vocabulary", "style"]);

export const quizQuestionSchema = z.object({
  category: quizCategorySchema,
  q: z.string(),
  opts: z.array(z.string()).length(4),
  /** Index (0-3) of the correct option. */
  answer: z.number().int().min(0).max(3),
  expl: z.string(),
  rule: z.string(),
});
export type QuizQuestion = z.infer<typeof quizQuestionSchema>;

export const generatedQuizSchema = z.object({
  questions: z.array(quizQuestionSchema).min(1),
});
export type GeneratedQuiz = z.infer<typeof generatedQuizSchema>;
