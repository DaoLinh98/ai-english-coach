// lib/tts.ts — shared speech-synthesis helper for "Listen" buttons across the app.

export type SpeakCallbacks = {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: () => void;
};

/**
 * Reads `text` aloud using the browser's SpeechSynthesis API.
 * No-ops on the server or when the text is empty / API is unavailable.
 */
export function speak(text: string, lang: string, callbacks: SpeakCallbacks = {}) {
  if (!text || typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = lang;
  utt.rate = 0.9;
  utt.onstart = () => callbacks.onStart?.();
  utt.onend = () => callbacks.onEnd?.();
  utt.onerror = () => callbacks.onError?.();
  window.speechSynthesis.speak(utt);
}
