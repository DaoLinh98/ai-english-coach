import type {
  Continuation,
  CorrectionResult,
  GeneratedFlashcard,
  GeneratedQuiz,
} from "./schema";

/**
 * Provider-agnostic interface for the AI engine. The Gemini implementation
 * lives in `gemini.ts`; swapping providers (or mocking in tests) only means
 * supplying another `AiProvider`. All implementations run server-side only.
 */

export type CorrectContext = "email" | "slack" | "jira" | "notes";
export type CorrectTone = "professional" | "casual" | "persuasive";
export type CorrectLevel = "beginner" | "intermediate" | "advanced";

export interface CorrectTextInput {
  text: string;
  context: CorrectContext;
  tone: CorrectTone;
  level: CorrectLevel;
  /** User's saved preferred vocabulary, woven into suggestions when relevant. */
  preferredVocab?: string[];
}

export interface GenerateFlashcardInput {
  word: string;
  /** Optional usage context to tune the definition/example. */
  context?: string;
}

export interface GenerateQuizInput {
  /** The user's saved vocabulary, to anchor vocabulary questions. */
  vocab?: string[];
  /** Recent mistakes (e.g. "faces → faced"), to target weak spots. */
  mistakes?: string[];
  count?: number;
}

export interface SuggestContinuationInput {
  /** The draft so far; the model proposes how to continue it. */
  text: string;
  context: CorrectContext;
  tone: CorrectTone;
  level: CorrectLevel;
}

export interface AiProvider {
  correctText(input: CorrectTextInput): Promise<CorrectionResult>;
  generateFlashcard(
    input: GenerateFlashcardInput,
  ): Promise<GeneratedFlashcard>;
  generateQuiz(input: GenerateQuizInput): Promise<GeneratedQuiz>;
  suggestContinuation(
    input: SuggestContinuationInput,
  ): Promise<Continuation>;
}
