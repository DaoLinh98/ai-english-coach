// lib/theme.ts — Dark mode theme contract shared across the app.
//
// Mechanism: a `data-theme="dark"` attribute is set on `<html>`. `app/globals.css`
// defines dark equivalents of every design token under `:root[data-theme="dark"]`.
// The chosen theme is persisted to localStorage under THEME_STORAGE_KEY; when no
// preference is stored, the OS `prefers-color-scheme` is used as the default.
//
// This module holds framework-agnostic, pure helpers so the resolution logic is
// unit-testable without a DOM. `components/ThemeProvider.tsx` wires these into
// React context + a `useTheme()` hook, and `app/layout.tsx` inlines
// `themeInitScript` in <head> so the correct theme is applied before hydration
// (avoiding a flash of the wrong theme).

export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "aec-theme";

export function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark";
}

/**
 * Resolves the theme that should apply given a raw localStorage value (or
 * null/undefined if unset) and whether the OS prefers dark mode.
 * Pure function — no DOM access — so it's easy to unit test.
 */
export function resolveInitialTheme(
  storedValue: string | null | undefined,
  prefersDark: boolean
): Theme {
  if (isTheme(storedValue)) return storedValue;
  return prefersDark ? "dark" : "light";
}

/**
 * Source for the inline <script> injected in app/layout.tsx's <head>.
 * Runs synchronously before hydration to set the `data-theme` attribute on
 * <html>, preventing a flash of the wrong theme on first paint.
 *
 * Kept as a plain string (not next/script) because it must execute
 * synchronously during HTML parsing, before React hydrates.
 */
export function themeInitScript(): string {
  return `(function(){try{var k=${JSON.stringify(
    THEME_STORAGE_KEY
  )};var s=localStorage.getItem(k);var t=(s==="light"||s==="dark")?s:(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");document.documentElement.setAttribute("data-theme",t);}catch(e){}})();`;
}
