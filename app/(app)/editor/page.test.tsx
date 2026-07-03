import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import EditorPage from "./page";

vi.mock("@/app/(app)/flashcards/actions", () => ({
  addFlashcardDirect: vi.fn(),
}));

const ORIGINAL_TEXT = "Toi di hoc";
const CORRECTED_TEXT = "I go to school";

function seedResultSession() {
  sessionStorage.setItem(
    "editorState",
    JSON.stringify({
      inputText: ORIGINAL_TEXT,
      translatedText: CORRECTED_TEXT,
      mode: "result",
    }),
  );
}

describe("EditorPage compare view toggle", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("defaults to the inline view showing the corrected text and a collapsed original", () => {
    seedResultSession();
    render(<EditorPage />);

    expect(screen.getByText("English Result")).toBeInTheDocument();
    expect(screen.getByText("Original text")).toBeInTheDocument();
    expect(screen.getAllByText(CORRECTED_TEXT).length).toBeGreaterThan(0);
    expect(screen.queryByText("Corrected")).not.toBeInTheDocument();
  });

  it("switches to the compare view showing original and corrected side by side", async () => {
    seedResultSession();
    render(<EditorPage />);

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /compare/i }));

    expect(screen.getByText("Original")).toBeInTheDocument();
    expect(screen.getByText("Corrected")).toBeInTheDocument();
    expect(screen.getAllByText(ORIGINAL_TEXT).length).toBeGreaterThan(0);
    expect(screen.getAllByText(CORRECTED_TEXT).length).toBeGreaterThan(0);
  });

  it("switches back to inline view from compare", async () => {
    seedResultSession();
    render(<EditorPage />);

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /compare/i }));
    await user.click(screen.getByRole("button", { name: /inline/i }));

    expect(screen.getByText("English Result")).toBeInTheDocument();
    expect(screen.queryByText("Corrected")).not.toBeInTheDocument();
  });
});
