"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Badge,
  Button,
  EmptyState,
  Icon,
  ProgressBar,
  Segmented,
  type SegOption,
} from "@/components/ui";
import { exportFlashcards } from "@/lib/export";

export type Flashcard = {
  id: string;
  word: string;
  pos: string | null;
  level: string;
  context: string | null;
  def: string;
  example: string | null;
  synonyms: string[];
  learned: boolean;
  phonetic: string | null;
};

const levelColor: Record<string, "green" | "amber" | "purple"> = {
  beginner: "green",
  intermediate: "amber",
  advanced: "purple",
};
const ctxColor: Record<string, "blue" | "orange" | "gray"> = {
  Technical: "blue",
  Business: "orange",
  Writing: "gray",
};

const LEVEL_FILTERS: SegOption[] = [
  { value: "all", label: "All" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

function FlashCardView({
  card,
  isFlipped,
  onFlip,
}: {
  card: Flashcard;
  isFlipped: boolean;
  onFlip: () => void;
}) {
  const [speaking, setSpeaking] = React.useState(false);

  function handleSpeak(e: React.MouseEvent) {
    e.stopPropagation();
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(card.word);
    utt.lang = "en-US";
    utt.rate = 0.85;
    utt.onstart = () => setSpeaking(true);
    utt.onend = () => setSpeaking(false);
    utt.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utt);
  }

  return (
    <div className="flip-scene" style={{ width: "100%", height: 360 }} onClick={onFlip}>
      <div className={`flip-inner${isFlipped ? " flipped" : ""}`}>
        {/* Front */}
        <div
          className="flip-f"
          style={{
            background: "var(--surface)",
            border: "2px solid var(--bord2)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "32px 40px",
            gap: 12,
            cursor: "pointer",
            boxShadow: "var(--sh2)",
          }}
        >
          <div style={{ display: "flex", gap: 8 }}>
            <Badge color={levelColor[card.level] || "gray"}>{card.level}</Badge>
            {card.context && (
              <Badge color={ctxColor[card.context] || "gray"}>{card.context}</Badge>
            )}
          </div>

          <p style={{ fontSize: 44, fontWeight: 800, color: "var(--t1)", letterSpacing: "-1.5px", textAlign: "center", lineHeight: 1.1 }}>
            {card.word}
          </p>

          {/* Phonetic + TTS row */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {card.phonetic && (
              <span style={{ fontSize: 15, color: "var(--t3)", fontFamily: "serif", letterSpacing: ".5px" }}>
                {card.phonetic}
              </span>
            )}
            <button
              onClick={handleSpeak}
              title="Listen to pronunciation"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 30,
                height: 30,
                borderRadius: "50%",
                border: "1.5px solid var(--bord2)",
                background: speaking ? "var(--amber-ll)" : "var(--surf2)",
                cursor: "pointer",
                transition: "all var(--fast)",
                color: speaking ? "var(--amber-d)" : "var(--t3)",
              }}
            >
              <Icon name="volume" size={14} color={speaking ? "var(--amber-d)" : "var(--t3)"} />
            </button>
          </div>

          {card.pos && <p style={{ fontSize: 13, color: "var(--t4)", fontStyle: "italic" }}>{card.pos}</p>}

          <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6, color: "var(--t4)", fontSize: 12 }}>
            <Icon name="rotate" size={13} />
            Click to reveal definition
          </div>
        </div>

        {/* Back */}
        <div
          className="flip-b"
          style={{
            background: "linear-gradient(160deg,var(--amber-ll) 0%,var(--surface) 60%)",
            border: "2px solid var(--amber-l)",
            padding: "28px 32px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
            cursor: "pointer",
            boxShadow: "var(--sh2)",
            overflowY: "auto",
          }}
        >
          <div style={{ display: "flex", gap: 8 }}>
            <Badge color={levelColor[card.level] || "gray"}>{card.level}</Badge>
            {card.context && (
              <Badge color={ctxColor[card.context] || "gray"}>{card.context}</Badge>
            )}
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--t3)", textTransform: "uppercase", letterSpacing: ".6px", marginBottom: 6 }}>
              Definition
            </p>
            <p style={{ fontSize: 16, fontWeight: 600, color: "var(--t1)", lineHeight: 1.55 }}>{card.def}</p>
          </div>
          {card.example && (
            <div style={{ background: "rgba(245,158,11,.08)", borderRadius: "var(--r3)", padding: "12px 14px" }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--amber-d)", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".5px" }}>
                Example
              </p>
              <p style={{ fontSize: 13, color: "var(--t2)", fontStyle: "italic", lineHeight: 1.6 }}>&ldquo;{card.example}&rdquo;</p>
            </div>
          )}
          {card.synonyms.length > 0 && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--t3)", textTransform: "uppercase", letterSpacing: ".6px", marginBottom: 6 }}>
                Synonyms
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {card.synonyms.map((s) => (
                  <Badge key={s} color="gray">{s}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function FlashcardsScreen({
  cards,
  toggleLearned,
}: {
  cards: Flashcard[];
  toggleLearned: (id: string, learned: boolean) => Promise<void>;
}) {
  const router = useRouter();
  const [idx, setIdx] = React.useState(0);
  const [flipped, setFlipped] = React.useState(false);
  const [filter, setFilter] = React.useState("all");
  const [search, setSearch] = React.useState("");
  const [done, setDone] = React.useState(false);
  const [known, setKnown] = React.useState<Set<string>>(new Set());
  const [studying, setStudying] = React.useState<Set<string>>(new Set());
  const [, startTransition] = React.useTransition();

  const knownCount = cards.filter((c) => c.learned).length;

  const filtered = cards.filter((c) => {
    const matchLevel = filter === "all" || c.level === filter;
    const matchSearch = !search || c.word.toLowerCase().includes(search.toLowerCase());
    return matchLevel && matchSearch;
  });

  const card = filtered[idx];

  function resetSession() {
    setIdx(0);
    setFlipped(false);
    setDone(false);
    setKnown(new Set());
    setStudying(new Set());
  }

  function persistLearned(id: string, learned: boolean) {
    startTransition(() => toggleLearned(id, learned));
  }

  function navigate(dir: 1 | -1) {
    setFlipped(false);
    setTimeout(() => setIdx((i) => Math.max(0, Math.min(filtered.length - 1, i + dir))), 150);
  }

  function goNext(action: "know" | "study") {
    if (card) {
      const id = card.id;
      if (action === "know") {
        setKnown((p) => new Set([...p, id]));
        setStudying((p) => { const n = new Set(p); n.delete(id); return n; });
      } else {
        setStudying((p) => new Set([...p, id]));
        setKnown((p) => { const n = new Set(p); n.delete(id); return n; });
      }
      persistLearned(id, action === "know");
    }
    setFlipped(false);
    setTimeout(() => {
      if (idx + 1 >= filtered.length) setDone(true);
      else setIdx((i) => i + 1);
    }, 200);
  }

  function restart() {
    setIdx(0);
    setFlipped(false);
    setDone(false);
    setKnown(new Set());
    setStudying(new Set());
    router.refresh();
  }

  const reviewingCount = filtered.length - filtered.filter((c) => c.learned).length;

  function handleExport() {
    exportFlashcards(
      cards.map((c) => ({
        word: c.word,
        pos: c.pos ?? "",
        level: c.level,
        context: c.context ?? "General",
        def: c.def,
        example: c.example ?? "",
        synonyms: c.synonyms ?? [],
        learned: c.learned,
      })),
    );
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "28px 32px 0", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-.5px", color: "var(--t1)", lineHeight: 1.2 }}>
              Flashcards
            </h1>
            <p style={{ color: "var(--t3)", fontSize: 14, marginTop: 4 }}>
              {cards.length} vocabulary {cards.length === 1 ? "card" : "cards"} · {knownCount} learned
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Badge color="green" icon="check">
              {knownCount} Known
            </Badge>
            <Badge color="amber" icon="refresh">
              {studying.size} Reviewing
            </Badge>
            {cards.length > 0 && (
              <Button variant="secondary" size="sm" icon="download" onClick={handleExport}>
                Export
              </Button>
            )}
          </div>
        </div>

        {/* Controls */}
        {cards.length > 0 && (
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 20 }}>
            <div style={{ position: "relative" }}>
              <Icon name="search" size={14} color="var(--t4)" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); resetSession(); }}
                placeholder="Search words…"
                style={{
                  paddingLeft: 32,
                  paddingRight: 12,
                  paddingTop: 7,
                  paddingBottom: 7,
                  fontSize: 13,
                  border: "1.5px solid var(--border)",
                  borderRadius: "var(--r3)",
                  fontFamily: "var(--font)",
                  color: "var(--t1)",
                  outline: "none",
                  background: "var(--surface)",
                  width: 180,
                }}
              />
            </div>
            <Segmented value={filter} onChange={(v) => { setFilter(v); resetSession(); }} options={LEVEL_FILTERS} size="sm" />
          </div>
        )}

        {/* Progress */}
        {cards.length > 0 && !done && filtered.length > 0 && (
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--t3)", marginBottom: 6 }}>
              <span>Card {Math.min(idx + 1, filtered.length)} of {filtered.length}</span>
              <span>{Math.round((idx / filtered.length) * 100)}% complete</span>
            </div>
            <ProgressBar value={idx} max={filtered.length} />
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "0 32px 32px" }}>
        {cards.length === 0 ? (
          <EmptyState
            icon="book"
            title="No flashcards yet"
            subtitle="Add words from the Editor — click '+ Add' next to any vocabulary suggestion."
          />
        ) : filtered.length === 0 ? (
          <EmptyState icon="search" title="No cards found" subtitle="Try a different search term or filter." />
        ) : done ? (
          <div
            className="a-bounce"
            style={{
              maxWidth: 500,
              margin: "40px auto",
              background: "var(--surface)",
              borderRadius: "var(--r5)",
              border: "2px solid var(--amber-l)",
              padding: "48px 40px",
              textAlign: "center",
              boxShadow: "var(--sh2)",
            }}
          >
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: "var(--amber-ll)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <Icon name="award" size={34} color="var(--amber-d)" />
            </div>
            <p style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-.5px", marginBottom: 8 }}>Session Complete!</p>
            <p style={{ color: "var(--t3)", fontSize: 14, marginBottom: 24 }}>
              You reviewed {filtered.length} card{filtered.length !== 1 ? "s" : ""}
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: 20, marginBottom: 28 }}>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 28, fontWeight: 800, color: "var(--green)" }}>{known.size}</p>
                <p style={{ fontSize: 12, color: "var(--t3)" }}>Known</p>
              </div>
              <div style={{ width: 1, background: "var(--bord2)" }} />
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 28, fontWeight: 800, color: "var(--amber-d)" }}>{studying.size}</p>
                <p style={{ fontSize: 12, color: "var(--t3)" }}>Need Review</p>
              </div>
            </div>
            <Button variant="primary" size="md" icon="refresh" onClick={restart} full>
              Study Again
            </Button>
          </div>
        ) : (
          <div style={{ maxWidth: 560, margin: "0 auto", paddingTop: 8 }}>
            {card && <FlashCardView card={card} isFlipped={flipped} onFlip={() => setFlipped((f) => !f)} />}

            {/* Navigation dots */}
            <div style={{ display: "flex", justifyContent: "center", gap: 6, margin: "16px 0 12px" }}>
              {filtered.map((c, i) => (
                <div
                  key={c.id}
                  onClick={() => { setIdx(i); setFlipped(false); }}
                  style={{
                    width: i === idx ? 20 : 7,
                    height: 7,
                    borderRadius: "var(--rmax)",
                    cursor: "pointer",
                    background: known.has(c.id) || c.learned ? "var(--green)" : i === idx ? "var(--amber)" : "var(--border)",
                    transition: "all var(--base)",
                  }}
                />
              ))}
            </div>

            {/* Prev / Next navigation */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <Button
                variant="secondary"
                size="md"
                icon="arr-l"
                onClick={() => navigate(-1)}
                disabled={idx === 0}
                style={{ minWidth: 110 }}
              >
                Previous
              </Button>
              <span style={{ fontSize: 12, color: "var(--t3)", fontWeight: 500 }}>
                {idx + 1} / {filtered.length}
              </span>
              <Button
                variant="secondary"
                size="md"
                iconRight="arr-r"
                onClick={() => navigate(1)}
                disabled={idx >= filtered.length - 1}
                style={{ minWidth: 110 }}
              >
                Next
              </Button>
            </div>

            {/* Study action buttons */}
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <Button
                variant="secondary"
                size="lg"
                icon="thu-d"
                onClick={() => goNext("study")}
                style={{ flex: 1, maxWidth: 220, color: "var(--t2)" }}
              >
                Study Again
              </Button>
              <Button
                variant="primary"
                size="lg"
                icon="thu-u"
                onClick={() => goNext("know")}
                style={{ flex: 1, maxWidth: 220 }}
              >
                I Know This ✓
              </Button>
            </div>

            <p style={{ textAlign: "center", fontSize: 12, color: "var(--t4)", marginTop: 14 }}>
              Click the card to flip · {reviewingCount} still to learn
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
