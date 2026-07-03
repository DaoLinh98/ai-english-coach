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
import { isDue, type SrsGrade } from "@/lib/srs";

export type Flashcard = {
  id: string;
  word: string;
  pos: string | null;
  level: string;
  context: string | null;
  tag: string | null;
  def: string;
  example: string | null;
  synonyms: string[];
  learned: boolean;
  phonetic: string | null;
  dueDate: string;
  reviewCount: number;
  created_at: string;
  updated_at: string;
};

const UNCATEGORIZED = "__uncategorized__";

const GRADE_BUTTONS: { grade: SrsGrade; label: string; icon: string; variant: "secondary" | "primary" }[] = [
  { grade: "again", label: "Again", icon: "x", variant: "secondary" },
  { grade: "hard", label: "Hard", icon: "thu-d", variant: "secondary" },
  { grade: "good", label: "Good", icon: "check", variant: "primary" },
  { grade: "easy", label: "Easy", icon: "thu-u", variant: "primary" },
];

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

const STUDY_MODES: SegOption[] = [
  { value: "flip", label: "Flip" },
  { value: "type", label: "Type" },
];

function TypingCardView({
  card,
  checked,
  isCorrect,
  typedAnswer,
  onChangeAnswer,
  onCheck,
}: {
  card: Flashcard;
  checked: boolean;
  isCorrect: boolean;
  typedAnswer: string;
  onChangeAnswer: (v: string) => void;
  onCheck: () => void;
}) {
  const [speaking, setSpeaking] = React.useState(false);

  function handleSpeak() {
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

  const maskedExample = card.example
    ? card.example.replace(new RegExp(card.word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), "_____")
    : null;

  return (
    <div
      style={{
        width: "100%",
        minHeight: 360,
        background: "var(--surface)",
        border: "2px solid var(--bord2)",
        borderRadius: "var(--r5)",
        boxShadow: "var(--sh2)",
        padding: "32px 40px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <div style={{ display: "flex", gap: 8 }}>
        <Badge color={levelColor[card.level] || "gray"}>{card.level}</Badge>
        {card.context && <Badge color={ctxColor[card.context] || "gray"}>{card.context}</Badge>}
      </div>

      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: "var(--t3)", textTransform: "uppercase", letterSpacing: ".6px", marginBottom: 6 }}>
          Definition
        </p>
        <p style={{ fontSize: 18, fontWeight: 600, color: "var(--t1)", lineHeight: 1.5 }}>{card.def}</p>
      </div>

      {maskedExample && (
        <div style={{ background: "rgba(245,158,11,.08)", borderRadius: "var(--r3)", padding: "12px 14px" }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "var(--amber-d)", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".5px" }}>
            Example
          </p>
          <p style={{ fontSize: 13, color: "var(--t2)", fontStyle: "italic", lineHeight: 1.6 }}>&ldquo;{maskedExample}&rdquo;</p>
        </div>
      )}

      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
        <input
          value={typedAnswer}
          onChange={(e) => onChangeAnswer(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !checked) onCheck();
          }}
          disabled={checked}
          placeholder="Type the word…"
          autoFocus
          style={{
            padding: "12px 14px",
            fontSize: 16,
            fontWeight: 600,
            border: `1.5px solid ${checked ? (isCorrect ? "var(--green)" : "var(--red)") : "var(--border)"}`,
            borderRadius: "var(--r3)",
            fontFamily: "var(--font)",
            color: "var(--t1)",
            outline: "none",
            background: checked ? (isCorrect ? "var(--green-l)" : "var(--surf2)") : "var(--surface)",
          }}
        />

        {!checked ? (
          <Button variant="primary" size="md" onClick={onCheck} disabled={!typedAnswer.trim()}>
            Check
          </Button>
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 14px",
              borderRadius: "var(--r3)",
              background: isCorrect ? "var(--green-l)" : "rgba(239,68,68,.08)",
            }}
          >
            <Icon name={isCorrect ? "check" : "x"} size={16} color={isCorrect ? "var(--green)" : "var(--red)"} />
            <span style={{ fontSize: 14, fontWeight: 600, color: isCorrect ? "var(--green)" : "var(--t1)" }}>
              {isCorrect ? "Correct!" : `Answer: ${card.word}`}
            </span>
            {card.phonetic && <span style={{ fontSize: 13, color: "var(--t3)", fontFamily: "serif" }}>{card.phonetic}</span>}
            <button
              onClick={handleSpeak}
              title="Listen to pronunciation"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 26,
                height: 26,
                borderRadius: "50%",
                border: "1.5px solid var(--bord2)",
                background: speaking ? "var(--amber-ll)" : "var(--surf2)",
                cursor: "pointer",
                marginLeft: "auto",
              }}
            >
              <Icon name="volume" size={12} color={speaking ? "var(--amber-d)" : "var(--t3)"} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function FlashCardView({
  card,
  isFlipped,
  onFlip,
  onEditTag,
}: {
  card: Flashcard;
  isFlipped: boolean;
  onFlip: () => void;
  onEditTag?: (card: Flashcard) => void;
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
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Badge color={levelColor[card.level] || "gray"}>{card.level}</Badge>
            {card.context && (
              <Badge color={ctxColor[card.context] || "gray"}>{card.context}</Badge>
            )}
            <Badge color="gray">{card.tag || "Uncategorized"}</Badge>
            {onEditTag && (
              <button
                onClick={(e) => { e.stopPropagation(); onEditTag(card); }}
                title="Edit tag"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  border: "1px solid var(--bord2)",
                  background: "var(--surf2)",
                  cursor: "pointer",
                }}
              >
                <Icon name="pen" size={10} color="var(--t3)" />
              </button>
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

const DUE_FILTERS: SegOption[] = [
  { value: "due", label: "Due" },
  { value: "all", label: "All cards" },
];

export function FlashcardsScreen({
  cards,
  reviewFlashcard,
  updateFlashcardTag,
  streak = 0,
  studiedToday = false,
}: {
  cards: Flashcard[];
  reviewFlashcard: (id: string, grade: SrsGrade) => Promise<void>;
  updateFlashcardTag?: (id: string, tag: string) => Promise<void>;
  streak?: number;
  studiedToday?: boolean;
}) {
  const router = useRouter();
  const [idx, setIdx] = React.useState(0);
  const [flipped, setFlipped] = React.useState(false);
  const [filter, setFilter] = React.useState("all");
  const [tagFilter, setTagFilter] = React.useState("all");
  const [dueFilter, setDueFilter] = React.useState("due");
  const [search, setSearch] = React.useState("");
  const [done, setDone] = React.useState(false);
  const [known, setKnown] = React.useState<Set<string>>(new Set());
  const [studying, setStudying] = React.useState<Set<string>>(new Set());
  const [studyMode, setStudyMode] = React.useState<"flip" | "type">("flip");
  const [typedAnswer, setTypedAnswer] = React.useState("");
  const [checked, setChecked] = React.useState(false);
  const [isCorrect, setIsCorrect] = React.useState(false);
  const [, startTransition] = React.useTransition();

  const knownCount = cards.filter((c) => c.learned).length;
  const dueCount = cards.filter((c) => isDue(c.dueDate)).length;

  const tagOptions: SegOption[] = React.useMemo(() => {
    const tags = Array.from(new Set(cards.map((c) => c.tag).filter((t): t is string => !!t))).sort();
    const hasUncategorized = cards.some((c) => !c.tag);
    return [
      { value: "all", label: "All" },
      ...tags.map((t) => ({ value: t, label: t })),
      ...(hasUncategorized ? [{ value: UNCATEGORIZED, label: "Uncategorized" }] : []),
    ];
  }, [cards]);

  const filtered = cards.filter((c) => {
    const matchLevel = filter === "all" || c.level === filter;
    const matchTag =
      tagFilter === "all" ||
      (tagFilter === UNCATEGORIZED ? !c.tag : c.tag === tagFilter);
    const matchSearch = !search || c.word.toLowerCase().includes(search.toLowerCase());
    const matchDue = dueFilter === "all" || isDue(c.dueDate);
    return matchLevel && matchTag && matchSearch && matchDue;
  });

  const card = filtered[idx];

  function resetSession() {
    setIdx(0);
    setFlipped(false);
    setDone(false);
    setKnown(new Set());
    setStudying(new Set());
    setTypedAnswer("");
    setChecked(false);
    setIsCorrect(false);
  }

  function persistReview(id: string, grade: SrsGrade) {
    startTransition(() => reviewFlashcard(id, grade));
  }

  function handleEditTag(c: Flashcard) {
    if (!updateFlashcardTag || typeof window === "undefined") return;
    const next = window.prompt("Set tag/category (leave blank for Uncategorized):", c.tag ?? "");
    if (next === null) return;
    startTransition(() => updateFlashcardTag(c.id, next));
  }

  function navigate(dir: 1 | -1) {
    setFlipped(false);
    setTypedAnswer("");
    setChecked(false);
    setIsCorrect(false);
    setTimeout(() => setIdx((i) => Math.max(0, Math.min(filtered.length - 1, i + dir))), 150);
  }

  function handleCheck() {
    if (!card) return;
    const correct = typedAnswer.trim().toLowerCase() === card.word.trim().toLowerCase();
    setIsCorrect(correct);
    setChecked(true);
  }

  function goNext(grade: SrsGrade) {
    if (card) {
      const id = card.id;
      if (grade === "good" || grade === "easy") {
        setKnown((p) => new Set([...p, id]));
        setStudying((p) => { const n = new Set(p); n.delete(id); return n; });
      } else {
        setStudying((p) => new Set([...p, id]));
        setKnown((p) => { const n = new Set(p); n.delete(id); return n; });
      }
      persistReview(id, grade);
    }
    setFlipped(false);
    setTypedAnswer("");
    setChecked(false);
    setIsCorrect(false);
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
    setTypedAnswer("");
    setChecked(false);
    setIsCorrect(false);
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
              {dueCount} Due
            </Badge>
            {cards.length > 0 && (
              <Button variant="secondary" size="sm" icon="download" onClick={handleExport}>
                Export
              </Button>
            )}
          </div>
        </div>

        {/* Daily streak reminder */}
        {cards.length > 0 && (streak > 0 || !studiedToday) && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 16px",
              borderRadius: "var(--r3)",
              marginBottom: 16,
              background: studiedToday ? "var(--green-l)" : "var(--amber-ll)",
              border: `1px solid ${studiedToday ? "var(--green)" : "var(--amber-l)"}`,
            }}
          >
            <Icon name="flame" size={16} color={studiedToday ? "var(--green)" : "var(--amber-d)"} />
            <span style={{ fontSize: 13, fontWeight: 600, color: studiedToday ? "var(--green)" : "var(--t1)" }}>
              {streak > 0
                ? studiedToday
                  ? `${streak}-day streak — nice work today!`
                  : `${streak}-day streak — study today to keep it going!`
                : "Study today to start a streak!"}
            </span>
          </div>
        )}

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
            {tagOptions.length > 1 && (
              <Segmented value={tagFilter} onChange={(v) => { setTagFilter(v); resetSession(); }} options={tagOptions} size="sm" />
            )}
            <Segmented value={dueFilter} onChange={(v) => { setDueFilter(v); resetSession(); }} options={DUE_FILTERS} size="sm" />
            <Segmented
              value={studyMode}
              onChange={(v) => { setStudyMode(v as "flip" | "type"); resetSession(); }}
              options={STUDY_MODES}
              size="sm"
            />
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
        ) : filtered.length === 0 && dueFilter === "due" ? (
          <EmptyState icon="check" title="All caught up!" subtitle="No cards are due for review right now. Switch to 'All cards' to study ahead of schedule." />
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
            {card && studyMode === "flip" && (
              <FlashCardView
                card={card}
                isFlipped={flipped}
                onFlip={() => setFlipped((f) => !f)}
                onEditTag={updateFlashcardTag ? handleEditTag : undefined}
              />
            )}
            {card && studyMode === "type" && (
              <TypingCardView
                card={card}
                checked={checked}
                isCorrect={isCorrect}
                typedAnswer={typedAnswer}
                onChangeAnswer={setTypedAnswer}
                onCheck={handleCheck}
              />
            )}

            {/* Navigation dots */}
            <div style={{ display: "flex", justifyContent: "center", gap: 6, margin: "16px 0 12px" }}>
              {filtered.map((c, i) => (
                <div
                  key={c.id}
                  onClick={() => { setIdx(i); setFlipped(false); setTypedAnswer(""); setChecked(false); setIsCorrect(false); }}
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

            {/* Study action buttons: SM-2 recall grading */}
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              {GRADE_BUTTONS.map((g) => (
                <Button
                  key={g.grade}
                  variant={g.variant}
                  size="lg"
                  icon={g.icon}
                  onClick={() => goNext(g.grade)}
                  disabled={studyMode === "type" && !checked}
                  style={{ flex: 1, maxWidth: 140 }}
                >
                  {g.label}
                </Button>
              ))}
            </div>

            <p style={{ textAlign: "center", fontSize: 12, color: "var(--t4)", marginTop: 14 }}>
              {studyMode === "flip" ? "Click the card to flip" : "Type the word, then check your answer"} · {reviewingCount} still to learn
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
