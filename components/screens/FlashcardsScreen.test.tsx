import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FlashcardsScreen, type Flashcard } from "@/components/screens/FlashcardsScreen";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

function makeCard(overrides: Partial<Flashcard> = {}): Flashcard {
  return {
    id: "1",
    word: "ephemeral",
    pos: "adjective",
    level: "advanced",
    context: "Writing",
    def: "lasting for a very short time",
    example: "The ephemeral beauty of cherry blossoms.",
    synonyms: ["fleeting", "transient"],
    learned: false,
    phonetic: "/ɪˈfem(ə)rəl/",
    dueDate: "2020-01-01",
    reviewCount: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

describe("FlashcardsScreen pronunciation playback", () => {
  const speak = vi.fn();
  const cancel = vi.fn();

  beforeEach(() => {
    speak.mockClear();
    cancel.mockClear();
    // jsdom does not implement the Web Speech API; provide minimal stubs.
    class FakeSpeechSynthesisUtterance {
      text: string;
      lang = "";
      rate = 1;
      onstart: (() => void) | null = null;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      constructor(text: string) {
        this.text = text;
      }
    }
    vi.stubGlobal("SpeechSynthesisUtterance", FakeSpeechSynthesisUtterance);
    Object.defineProperty(window, "speechSynthesis", {
      writable: true,
      configurable: true,
      value: { speak, cancel },
    });
  });

  it("plays pronunciation from the flip-card front without triggering a flip", () => {
    render(
      <FlashcardsScreen cards={[makeCard()]} reviewFlashcard={vi.fn().mockResolvedValue(undefined)} />,
    );

    const listenButtons = screen.getAllByRole("button", { name: /listen to pronunciation/i });
    expect(listenButtons.length).toBeGreaterThan(0);

    fireEvent.click(listenButtons[0]);

    expect(speak).toHaveBeenCalledTimes(1);
    const utterance = speak.mock.calls[0][0] as SpeechSynthesisUtterance;
    expect(utterance.text).toBe("ephemeral");
    expect(utterance.lang).toBe("en-US");

    // Clicking Listen must not have flipped the card to the "back" reveal state.
    expect(screen.getByText("Click to reveal definition")).toBeInTheDocument();
  });

  it("plays pronunciation in typing mode without disturbing the answer input", () => {
    render(
      <FlashcardsScreen cards={[makeCard()]} reviewFlashcard={vi.fn().mockResolvedValue(undefined)} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Type" }));

    const input = screen.getByPlaceholderText("Type the word…") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "eph" } });

    const listenButton = screen.getByRole("button", { name: /listen to pronunciation/i });
    fireEvent.click(listenButton);

    expect(speak).toHaveBeenCalledTimes(1);
    const utterance = speak.mock.calls[0][0] as SpeechSynthesisUtterance;
    expect(utterance.text).toBe("ephemeral");
    expect(utterance.lang).toBe("en-US");

    // Input value must be unaffected by the Listen click.
    expect(input.value).toBe("eph");
  });
});
