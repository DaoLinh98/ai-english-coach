import { describe, expect, it } from "vitest";
import {
  THEME_STORAGE_KEY,
  isTheme,
  resolveInitialTheme,
  themeInitScript,
} from "@/lib/theme";

describe("isTheme", () => {
  it("accepts light and dark", () => {
    expect(isTheme("light")).toBe(true);
    expect(isTheme("dark")).toBe(true);
  });

  it("rejects anything else", () => {
    expect(isTheme(null)).toBe(false);
    expect(isTheme(undefined)).toBe(false);
    expect(isTheme("")).toBe(false);
    expect(isTheme("system")).toBe(false);
  });
});

describe("resolveInitialTheme", () => {
  it("uses the stored value when it is a valid theme", () => {
    expect(resolveInitialTheme("dark", false)).toBe("dark");
    expect(resolveInitialTheme("light", true)).toBe("light");
  });

  it("falls back to the OS preference when nothing is stored", () => {
    expect(resolveInitialTheme(null, true)).toBe("dark");
    expect(resolveInitialTheme(undefined, false)).toBe("light");
  });

  it("falls back to the OS preference when the stored value is invalid", () => {
    expect(resolveInitialTheme("not-a-theme", true)).toBe("dark");
  });
});

describe("themeInitScript", () => {
  it("references the storage key and sets data-theme on <html>", () => {
    const script = themeInitScript();
    expect(script).toContain(THEME_STORAGE_KEY);
    expect(script).toContain("data-theme");
    expect(script).toContain("prefers-color-scheme: dark");
  });
});
