import type { AiProvider } from "./provider";
import { createGeminiProvider } from "./gemini";
import { createOllamaProvider } from "./ollama";

let cached: AiProvider | null = null;

/**
 * Returns the configured AI provider, memoised per server runtime. Set
 * AI_PROVIDER=ollama to use a local Ollama server instead of Gemini
 * (see OLLAMA_BASE_URL / OLLAMA_MODEL) — useful when Gemini's free-tier
 * quota is exhausted for the day.
 */
export function getAiProvider(): AiProvider {
  if (!cached) {
    cached =
      process.env.AI_PROVIDER === "ollama"
        ? createOllamaProvider()
        : createGeminiProvider();
  }
  return cached;
}

export * from "./schema";
export * from "./provider";
