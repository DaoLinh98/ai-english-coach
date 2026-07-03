import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FlashcardsScreen, type Flashcard } from "@/components/screens/FlashcardsScreen";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

function makeCard(overrides: Partial<Flashcard>): Flashcard {
  return {
    id: overrides.id ?? "1",
    word: "word",
    pos: "noun",
    level: "beginner",
    context: null,
    tag: null,
    def: "a definition",
    example: null,
    synonyms: [],
    learned: false,
    phonetic: null,
    dueDate: "2000-01-01", // far in the past — always due
    reviewCount: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

describe("FlashcardsScreen tag filter", () => {
  const cards: Flashcard[] = [
    makeCard({ id: "1", word: "apple", tag: "Fruit" }),
    makeCard({ id: "2", word: "banana", tag: "Fruit" }),
    makeCard({ id: "3", word: "car", tag: "Vehicle" }),
    makeCard({ id: "4", word: "desk", tag: null }),
  ];

  it("shows a tag filter listing available tags plus Uncategorized", () => {
    render(<FlashcardsScreen cards={cards} reviewFlashcard={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Fruit" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Vehicle" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Uncategorized" })).toBeInTheDocument();
  });

  it("filters the study session to cards matching the selected tag", () => {
    render(<FlashcardsScreen cards={cards} reviewFlashcard={vi.fn()} />);
    // Switch to "All cards" so due-date filtering doesn't hide anything unexpected.
    fireEvent.click(screen.getByRole("button", { name: "All cards" }));
    fireEvent.click(screen.getByRole("button", { name: "Vehicle" }));
    expect(screen.getByText("car")).toBeInTheDocument();
    expect(screen.queryByText("apple")).not.toBeInTheDocument();
  });

  it("filters to the Uncategorized bucket for cards without a tag", () => {
    render(<FlashcardsScreen cards={cards} reviewFlashcard={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "All cards" }));
    fireEvent.click(screen.getByRole("button", { name: "Uncategorized" }));
    expect(screen.getByText("desk")).toBeInTheDocument();
    expect(screen.queryByText("apple")).not.toBeInTheDocument();
  });
});
