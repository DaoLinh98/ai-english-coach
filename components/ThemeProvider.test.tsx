import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ThemeProvider, useTheme } from "@/components/ThemeProvider";
import { THEME_STORAGE_KEY } from "@/lib/theme";

function Consumer() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button onClick={toggleTheme}>
      {theme === "dark" ? "dark" : "light"}
    </button>
  );
}

describe("ThemeProvider", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  afterEach(() => {
    document.documentElement.removeAttribute("data-theme");
  });

  it("defaults to light when the DOM has no data-theme attribute", () => {
    render(
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>
    );
    expect(screen.getByRole("button")).toHaveTextContent("light");
  });

  it("adopts the theme already applied to <html> (set by the inline init script)", () => {
    document.documentElement.setAttribute("data-theme", "dark");
    render(
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>
    );
    expect(screen.getByRole("button")).toHaveTextContent("dark");
  });

  it("toggles the theme, updates the DOM attribute, and persists to localStorage", async () => {
    render(
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByRole("button"));

    // The theme is read via a MutationObserver-backed external store, which
    // notifies asynchronously — wait for the re-render to flush.
    await waitFor(() =>
      expect(screen.getByRole("button")).toHaveTextContent("dark")
    );
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");

    fireEvent.click(screen.getByRole("button"));

    await waitFor(() =>
      expect(screen.getByRole("button")).toHaveTextContent("light")
    );
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
  });

  it("throws when useTheme is used outside a ThemeProvider", () => {
    function Bare() {
      useTheme();
      return null;
    }
    expect(() => render(<Bare />)).toThrow(
      "useTheme must be used within a ThemeProvider"
    );
  });
});
