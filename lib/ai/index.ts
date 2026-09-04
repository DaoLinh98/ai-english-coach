import type { AiProvider } from "./provider";
import { createOllamaProvider } from "./ollama";

let cached: AiProvider | null = null;

/** Returns the configured AI provider (Ollama), memoised per server runtime. */
export function getAiProvider(): AiProvider {
  if (!cached) {
    cached = createOllamaProvider();
  }
  return cached;
}

export * from "./schema";
export * from "./provider";
