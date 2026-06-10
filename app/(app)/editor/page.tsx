"use client";
// app/(app)/editor/page.tsx — Text editor with inline AI corrections.
// Ported from prototype screen-editor.jsx; mock data replaced with the
// analyzeText Server Action (Gemini) and client-computed offsets.

import React from "react";
import {
  Badge,
  Button,
  EmptyState,
  Icon,
  ProgressBar,
  Segmented,
  Spinner,
  type SegOption,
} from "@/components/ui";
import type {
  CorrectContext,
  CorrectLevel,
  CorrectTone,
} from "@/lib/ai";
import {
  applyAccepted,
  locateCorrections,
  type LocatedCorrection,
} from "@/lib/corrections";
import { exportCorrection } from "@/lib/export";
import { analyzeText } from "./actions";

const SAMPLE_TEXT = `Hi team,

I want inform you that the development team already finish the Sprint 12 implementation last week. We faces some challenges during the testing phase, and the critical bugs needs to be fix before we can deploy to the production environment. The impacts on end users will be minimal if we can resolve these issues quick.

Please let me know if you have any questions.

Best regards,
Alex`;

const CONTEXTS: { value: CorrectContext; label: string; icon: string }[] = [
  { value: "email", label: "Email", icon: "mail" },
  { value: "slack", label: "Slack", icon: "msg-sq" },
  { value: "jira", label: "Jira", icon: "file-txt" },
  { value: "notes", label: "Notes", icon: "clipboard" },
];
const TONES: SegOption<CorrectTone>[] = [
  { value: "professional", label: "Professional" },
  { value: "casual", label: "Casual" },
  { value: "persuasive", label: "Persuasive" },
];
const LEVELS: SegOption<CorrectLevel>[] = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

const TYPE_META: Record<
  LocatedCorrection["type"],
  { label: string; color: string; bg: string; badgeColor: "red" | "blue" | "amber" }
> = {
  grammar: { label: "Grammar", color: "var(--red)", bg: "var(--red-l)", badgeColor: "red" },
  style: { label: "Style", color: "var(--blue)", bg: "var(--blue-l)", badgeColor: "blue" },
  vocab: { label: "Vocabulary", color: "var(--amber-d)", bg: "var(--amber-ll)", badgeColor: "amber" },
};

type Mode = "input" | "loading" | "review";

function queueFlashcard(word: string) {
  try {
    const key = "flashcardQueue";
    const cur: string[] = JSON.parse(localStorage.getItem(key) || "[]");
    if (!cur.includes(word)) cur.push(word);
    localStorage.setItem(key, JSON.stringify(cur));
  } catch {
    // ignore storage failures
  }
}

function renderAnnotated(
  text: string,
  corrections: LocatedCorrection[],
  accepted: Set<number>,
  activeId: number | null,
  onSelect: (id: number) => void,
) {
  const sorted = [...corrections].sort((a, b) => a.start - b.start);
  const parts: React.ReactNode[] = [];
  let pos = 0;

  for (const c of sorted) {
    if (c.start > pos) {
      parts.push(
        <React.Fragment key={`t${pos}`}>{text.slice(pos, c.start)}</React.Fragment>,
      );
    }
    if (accepted.has(c.id)) {
      parts.push(
        <span key={`c${c.id}`} className="c-ok">
          {c.suggest}
        </span>,
      );
    } else {
      const cls = `c-${c.type === "grammar" ? "g" : c.type === "style" ? "s" : "v"}${
        activeId === c.id ? " hi" : ""
      }`;
      parts.push(
        <span
          key={`c${c.id}`}
          className={cls}
          title={`Suggestion: ${c.suggest}`}
          onClick={() => onSelect(c.id)}
        >
          {text.slice(c.start, c.end)}
        </span>,
      );
    }
    pos = c.end;
  }
  if (pos < text.length)
    parts.push(<React.Fragment key="tend">{text.slice(pos)}</React.Fragment>);
  return parts;
}

function CorrectionCard({
  corr,
  isActive,
  isAccepted,
  onAccept,
  onLearn,
  onSelect,
}: {
  corr: LocatedCorrection;
  isActive: boolean;
  isAccepted: boolean;
  onAccept: (id: number) => void;
  onLearn: (corr: LocatedCorrection) => void;
  onSelect: (id: number) => void;
}) {
  const meta = TYPE_META[corr.type] || TYPE_META.grammar;
  const cardRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isActive && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [isActive]);

  return (
    <div
      ref={cardRef}
      onClick={() => onSelect(corr.id)}
      style={{
        borderRadius: "var(--r3)",
        border: `1.5px solid ${isActive ? meta.color : "var(--bord2)"}`,
        padding: "14px 16px",
        cursor: "pointer",
        transition: "all var(--fast)",
        background: isAccepted ? "var(--green-l)" : isActive ? meta.bg : "var(--surface)",
        opacity: isAccepted ? 0.7 : 1,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 8,
          marginBottom: 8,
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <Badge color={meta.badgeColor} size="xs">
              {meta.label}
            </Badge>
            {isAccepted && (
              <Badge color="green" size="xs">
                Accepted
              </Badge>
            )}
          </div>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--t1)" }}>{corr.label}</p>
        </div>
        <div style={{ flexShrink: 0, marginTop: 2 }}>
          {isAccepted ? (
            <Icon name="check" size={16} color="var(--green)" />
          ) : (
            <Icon name="chev-r" size={14} color="var(--t4)" />
          )}
        </div>
      </div>

      {/* Before / After */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 10,
          padding: "8px 10px",
          background: "var(--surf2)",
          borderRadius: "var(--r2)",
        }}
      >
        <span style={{ fontSize: 13, color: "var(--red)", textDecoration: "line-through", flex: 1 }}>
          {corr.find}
        </span>
        <Icon name="arr-r" size={12} color="var(--t4)" />
        <span style={{ fontSize: 13, color: "var(--green)", fontWeight: 600, flex: 1 }}>
          {corr.suggest}
        </span>
      </div>

      {/* Explanation */}
      <p style={{ fontSize: 12, color: "var(--t2)", lineHeight: 1.55, marginBottom: 10 }}>
        {corr.expl}
      </p>

      {/* Rule tag */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Badge color="gray" size="xs" icon="info">
          {corr.rule}
        </Badge>
        {!isAccepted && (
          <div style={{ display: "flex", gap: 6 }}>
            <Button
              size="xs"
              variant="ghost"
              style={{ color: "var(--t3)", padding: "4px 8px" }}
              onClick={(e) => {
                e.stopPropagation();
                onLearn(corr);
              }}
            >
              Learn
            </Button>
            <Button
              size="xs"
              variant="soft"
              onClick={(e) => {
                e.stopPropagation();
                onAccept(corr.id);
              }}
            >
              Accept
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function EditorPage() {
  const [text, setText] = React.useState(SAMPLE_TEXT);
  const [analyzed, setAnalyzed] = React.useState("");
  const [mode, setMode] = React.useState<Mode>("input");
  const [corrections, setCorrections] = React.useState<LocatedCorrection[]>([]);
  const [accepted, setAccepted] = React.useState<Set<number>>(new Set());
  const [activeId, setActiveId] = React.useState<number | null>(null);
  const [context, setContext] = React.useState<CorrectContext>("email");
  const [tone, setTone] = React.useState<CorrectTone>("professional");
  const [level, setLevel] = React.useState<CorrectLevel>("intermediate");
  const [filterType, setFilterType] = React.useState<"all" | "grammar" | "style" | "vocab">("all");
  const [copyDone, setCopyDone] = React.useState(false);
  const [toast, setToast] = React.useState<string | null>(null);
  const [narrow, setNarrow] = React.useState(false);

  React.useEffect(() => {
    const h = () => setNarrow(window.innerWidth < 960);
    h();
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  // Honor a ?context= preset (e.g. from the Dashboard "Quick Start" links).
  React.useEffect(() => {
    const c = new URLSearchParams(window.location.search).get("context");
    if (c === "email" || c === "slack" || c === "jira" || c === "notes") {
      setContext(c);
    }
  }, []);

  const remaining = corrections.filter((c) => !accepted.has(c.id));
  const filtered = filterType === "all" ? remaining : remaining.filter((c) => c.type === filterType);
  const grammarCount = remaining.filter((c) => c.type === "grammar").length;
  const styleCount = remaining.filter((c) => c.type === "style").length;
  const vocabCount = remaining.filter((c) => c.type === "vocab").length;

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  async function handleAnalyze() {
    const snapshot = text;
    setMode("loading");
    try {
      const result = await analyzeText({ text: snapshot, context, tone, level });
      setAnalyzed(snapshot);
      setCorrections(locateCorrections(snapshot, result.items));
      setAccepted(new Set());
      setActiveId(null);
      setFilterType("all");
      setMode("review");
    } catch {
      setMode("input");
      showToast("Analysis failed — please try again.");
    }
  }

  function handleAccept(id: number) {
    setAccepted((prev) => new Set([...prev, id]));
    const next = remaining.find((c) => c.id !== id);
    setActiveId(next ? next.id : null);
  }

  function handleAcceptAll() {
    setAccepted(new Set(corrections.map((c) => c.id)));
    setActiveId(null);
  }

  function handleLearn(corr: LocatedCorrection) {
    queueFlashcard(corr.suggest);
    showToast(`"${corr.suggest}" added to Flashcards!`);
  }

  function handleCopy() {
    const result = applyAccepted(analyzed, corrections, accepted);
    navigator.clipboard.writeText(result).catch(() => {});
    setCopyDone(true);
    setTimeout(() => setCopyDone(false), 1500);
  }

  function handleExport() {
    const result = applyAccepted(analyzed, corrections, accepted);
    exportCorrection(result, corrections);
    showToast("Exported corrected text + explanations.");
  }

  function handleReset() {
    setMode("input");
    setAccepted(new Set());
    setActiveId(null);
    setCorrections([]);
    if (analyzed) setText(analyzed);
  }

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Top bar */}
      <div style={{ flexShrink: 0, borderBottom: "1px solid var(--bord2)", background: "var(--surface)" }}>
        <div style={{ padding: "14px 24px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          {/* Context tabs */}
          <div style={{ display: "flex", gap: 2, background: "var(--bord2)", borderRadius: "var(--r3)", padding: 3 }}>
            {CONTEXTS.map((c) => (
              <button
                key={c.value}
                onClick={() => setContext(c.value)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "6px 13px",
                  fontSize: 13,
                  fontWeight: context === c.value ? 600 : 500,
                  border: "none",
                  borderRadius: "var(--r2)",
                  cursor: "pointer",
                  fontFamily: "var(--font)",
                  background: context === c.value ? "var(--surface)" : "transparent",
                  color: context === c.value ? "var(--t1)" : "var(--t3)",
                  boxShadow: context === c.value ? "var(--sh1)" : "none",
                  transition: "all var(--fast)",
                }}
              >
                <Icon name={c.icon} size={13} />
                {c.label}
              </button>
            ))}
          </div>

          <div style={{ width: 1, height: 24, background: "var(--bord2)" }} />

          {/* Tone */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="sliders" size={14} color="var(--t3)" />
            <span style={{ fontSize: 12, color: "var(--t3)", fontWeight: 500 }}>Tone</span>
            <Segmented options={TONES} value={tone} onChange={setTone} size="sm" />
          </div>

          <div style={{ width: 1, height: 24, background: "var(--bord2)" }} />

          {/* Level */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="grad-cap" size={14} color="var(--t3)" />
            <span style={{ fontSize: 12, color: "var(--t3)", fontWeight: 500 }}>Level</span>
            <Segmented options={LEVELS} value={level} onChange={setLevel} size="sm" />
          </div>

          {mode === "review" && (
            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              <Button
                variant="secondary"
                size="sm"
                icon={copyDone ? "check" : "copy"}
                onClick={handleCopy}
                style={copyDone ? { color: "var(--green)" } : {}}
              >
                {copyDone ? "Copied!" : "Copy Text"}
              </Button>
              <Button variant="secondary" size="sm" icon="download" onClick={handleExport}>
                Export
              </Button>
              <Button variant="ghost" size="sm" icon="refresh" onClick={handleReset}>
                Reset
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Body: editor + panel */}
      <div style={{ flex: 1, display: "flex", flexDirection: narrow ? "column" : "row", overflow: "hidden" }}>
        {/* Editor area */}
        <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "24px" }}>
          {mode === "input" && (
            <div className="a-up" style={{ height: "100%", display: "flex", flexDirection: "column", gap: 16 }}>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                spellCheck={false}
                placeholder="Paste or type your text here…"
                style={{
                  flex: 1,
                  minHeight: 320,
                  padding: "20px",
                  fontSize: 15,
                  lineHeight: 1.8,
                  fontFamily: "var(--font)",
                  color: "var(--t1)",
                  border: "1.5px solid var(--border)",
                  borderRadius: "var(--r4)",
                  resize: "none",
                  outline: "none",
                  background: "var(--surface)",
                  transition: "border-color var(--fast)",
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--amber)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Button variant="primary" size="md" icon="sparkles" onClick={handleAnalyze} disabled={!text.trim()}>
                  Analyze with AI
                </Button>
                <span style={{ fontSize: 12, color: "var(--t3)" }}>{wordCount} words</span>
              </div>
            </div>
          )}

          {mode === "loading" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 20 }}>
              <div style={{ width: 56, height: 56, borderRadius: "var(--r5)", background: "var(--amber-ll)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Spinner size={28} color="var(--amber-d)" />
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontWeight: 700, fontSize: 16, color: "var(--t1)" }}>Analyzing your text…</p>
                <p style={{ fontSize: 13, color: "var(--t3)", marginTop: 4 }}>Checking grammar, vocabulary &amp; style</p>
              </div>
              <div style={{ width: 200 }}>
                <ProgressBar value={66} color="var(--amber)" height={4} />
              </div>
            </div>
          )}

          {mode === "review" && (
            <div className="a-up">
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <Badge color={remaining.length === 0 ? "green" : "amber"}>
                  {corrections.length === 0
                    ? "No issues found — looks great!"
                    : remaining.length === 0
                      ? "All corrections applied!"
                      : `${remaining.length} suggestion${remaining.length !== 1 ? "s" : ""} remaining`}
                </Badge>
                {remaining.length > 0 && (
                  <Button variant="soft" size="xs" onClick={handleAcceptAll}>
                    Accept All
                  </Button>
                )}
              </div>

              <div
                style={{
                  background: "var(--surface)",
                  borderRadius: "var(--r4)",
                  border: "1.5px solid var(--bord2)",
                  padding: "24px",
                  fontSize: 15,
                  lineHeight: 1.9,
                  color: "var(--t1)",
                  fontFamily: "var(--font)",
                  whiteSpace: "pre-wrap",
                }}
              >
                {renderAnnotated(analyzed, corrections, accepted, activeId, setActiveId)}
              </div>

              {corrections.length > 0 && (
                <div style={{ marginTop: 14, padding: "12px 16px", background: "var(--bord2)", borderRadius: "var(--r3)", display: "flex", gap: 20, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12, color: "var(--t3)" }}>Click underlined text to see corrections</span>
                  <div style={{ display: "flex", gap: 12 }}>
                    <span style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ width: 10, height: 3, background: "var(--red)", display: "inline-block", borderRadius: 2 }} />
                      Grammar
                    </span>
                    <span style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ width: 10, height: 3, background: "var(--amber-d)", display: "inline-block", borderRadius: 2 }} />
                      Vocabulary
                    </span>
                    <span style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ width: 10, height: 3, background: "var(--blue)", display: "inline-block", borderRadius: 2 }} />
                      Style
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Corrections panel */}
        <div
          style={{
            width: narrow ? "100%" : 320,
            flexShrink: 0,
            borderLeft: narrow ? "none" : "1px solid var(--bord2)",
            borderTop: narrow ? "1px solid var(--bord2)" : "none",
            overflowY: "auto",
            overflowX: "hidden",
            background: "var(--surf2)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ padding: "16px 16px 10px", borderBottom: "1px solid var(--bord2)", background: "var(--surface)", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <p style={{ fontWeight: 700, fontSize: 14, color: "var(--t1)" }}>Suggestions</p>
              {mode === "review" && corrections.length > 0 && <Badge color="amber">{corrections.length} total</Badge>}
            </div>
            {mode === "review" && corrections.length > 0 && (
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {[
                  { type: "all" as const, label: `All (${remaining.length})` },
                  { type: "grammar" as const, label: `Grammar (${grammarCount})` },
                  { type: "style" as const, label: `Style (${styleCount})` },
                  { type: "vocab" as const, label: `Vocab (${vocabCount})` },
                ].map((f) => (
                  <button
                    key={f.type}
                    onClick={() => setFilterType(f.type)}
                    style={{
                      padding: "4px 10px",
                      fontSize: 12,
                      fontWeight: filterType === f.type ? 600 : 500,
                      border: "1px solid",
                      borderRadius: "var(--rmax)",
                      cursor: "pointer",
                      fontFamily: "var(--font)",
                      transition: "all var(--fast)",
                      background: filterType === f.type ? "var(--amber)" : "transparent",
                      borderColor: filterType === f.type ? "var(--amber)" : "var(--border)",
                      color: filterType === f.type ? "#fff" : "var(--t2)",
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ flex: 1, padding: 12, display: "flex", flexDirection: "column", gap: 10, overflowY: "auto" }}>
            {mode === "input" && (
              <EmptyState
                icon="sparkles"
                title="Analyze to see suggestions"
                subtitle="Paste your text and click 'Analyze with AI' to get correction suggestions."
              />
            )}
            {mode === "loading" &&
              [1, 2, 3].map((i) => (
                <div key={i} style={{ background: "var(--surface)", borderRadius: "var(--r3)", border: "1px solid var(--bord2)", padding: 16 }}>
                  <div className="skel" style={{ height: 12, width: "60%", marginBottom: 10 }} />
                  <div className="skel" style={{ height: 10, width: "90%", marginBottom: 6 }} />
                  <div className="skel" style={{ height: 10, width: "75%" }} />
                </div>
              ))}
            {mode === "review" && remaining.length === 0 && (
              <div style={{ textAlign: "center", padding: 32 }}>
                <div style={{ width: 48, height: 48, background: "var(--green-l)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                  <Icon name="check" size={22} color="var(--green)" />
                </div>
                <p style={{ fontWeight: 700, fontSize: 15, color: "var(--t1)" }}>
                  {corrections.length === 0 ? "Looks great!" : "All done!"}
                </p>
                <p style={{ fontSize: 13, color: "var(--t3)", marginTop: 4 }}>
                  {corrections.length === 0
                    ? "No corrections were suggested."
                    : "All corrections have been applied."}
                </p>
              </div>
            )}
            {mode === "review" &&
              filtered.map((c, i) => (
                <div key={c.id} className={`a-up a-d${Math.min(i + 1, 6)}`}>
                  <CorrectionCard
                    corr={c}
                    isActive={activeId === c.id}
                    isAccepted={accepted.has(c.id)}
                    onAccept={handleAccept}
                    onLearn={handleLearn}
                    onSelect={setActiveId}
                  />
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className="a-pop"
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            background: "var(--t1)",
            color: "#fff",
            padding: "10px 20px",
            borderRadius: "var(--rmax)",
            fontSize: 13,
            fontWeight: 600,
            boxShadow: "var(--sh3)",
            zIndex: 1000,
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
