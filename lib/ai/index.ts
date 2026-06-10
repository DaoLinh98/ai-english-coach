import type { AiProvider } from "./provider";
import { createGeminiProvider } from "./gemini";

let cached: AiProvider | null = null;

/** Returns the configured AI provider (Gemini), memoised per server runtime. */
export function getAiProvider(): AiProvider {
  if (!cached) cached = createGeminiProvider();
  return cached;
}

export * from "./schema";
export * from "./provider";
