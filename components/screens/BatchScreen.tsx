"use client";
// components/screens/BatchScreen.tsx — Batch processing: correct multiple
// text blocks at once. Reuses the analyzeText Server Action per block and the
// shared export helpers. Additive feature (not in the prototype).

import React from "react";
import { Badge, Button, Icon, Segmented, Spinner, type SegOption } from "@/components/ui";
import type { CorrectContext, CorrectLevel, CorrectionResult, CorrectTone } from "@/lib/ai";
import { locateCorrections } from "@/lib/corrections";
import { buildCorrectionMarkdown, triggerDownload } from "@/lib/export";

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

type BlockStatus = "idle" | "loading" | "done" | "error";
type Block = {
  id: number;
  input: string;
  status: BlockStatus;
  result: CorrectionResult | null;
};

let nextId = 1;
function newBlock(input = ""): Block {
  return { id: nextId++, input, status: "idle", result: null };
}

export function BatchScreen({
  analyzeText,
}: {
  analyzeText: (input: {
    text: string;
    context: CorrectContext;
    tone: CorrectTone;
    level: CorrectLevel;
  }) => Promise<CorrectionResult>;
}) {
  const [blocks, setBlocks] = React.useState<Block[]>(() => [newBlock(), newBlock()]);
  const [context, setContext] = React.useState<CorrectContext>("email");
  const [tone, setTone] = React.useState<CorrectTone>("professional");
  const [level, setLevel] = React.useState<CorrectLevel>("intermediate");
  const [running, setRunning] = React.useState(false);
  const [copiedId, setCopiedId] = React.useState<number | null>(null);

  const filled = blocks.filter((b) => b.input.trim());
  const doneBlocks = blocks.filter((b) => b.status === "done" && b.result);

  function updateBlock(id: number, patch: Partial<Block>) {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }

  function addBlock() {
    setBlocks((prev) => [...prev, newBlock()]);
  }

  function removeBlock(id: number) {
    setBlocks((prev) => (prev.length <= 1 ? prev : prev.filter((b) => b.id !== id)));
  }

  async function analyzeAll() {
    const targets = blocks.filter((b) => b.input.trim());
    if (!targets.length) return;
    setRunning(true);
    setBlocks((prev) =>
      prev.map((b) => (b.input.trim() ? { ...b, status: "loading", result: null } : b)),
    );
    await Promise.all(
      targets.map(async (b) => {
        try {
          const result = await analyzeText({ text: b.input, context, tone, level });
          updateBlock(b.id, { status: "done", result });
        } catch {
          updateBlock(b.id, { status: "error", result: null });
        }
      }),
    );
    setRunning(false);
  }

  function copyBlock(b: Block) {
    if (!b.result) return;
    navigator.clipboard.writeText(b.result.correctedText).catch(() => {});
    setCopiedId(b.id);
    setTimeout(() => setCopiedId((id) => (id === b.id ? null : id)), 1500);
  }

  function exportAll() {
    const parts = doneBlocks.map((b, i) => {
      const located = locateCorrections(b.input, b.result!.items);
      return `# Block ${i + 1}\n\n${buildCorrectionMarkdown(b.result!.correctedText, located)}`;
    });
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    triggerDownload(`batch-corrections-${stamp}.md`, parts.join("\n\n---\n\n"));
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Toolbar */}
      <div style={{ flexShrink: 0, borderBottom: "1px solid var(--bord2)", background: "var(--surface)" }}>
        <div style={{ padding: "14px 24px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
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
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="sliders" size={14} color="var(--t3)" />
            <Segmented options={TONES} value={tone} onChange={setTone} size="sm" />
          </div>
          <div style={{ width: 1, height: 24, background: "var(--bord2)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="grad-cap" size={14} color="var(--t3)" />
            <Segmented options={LEVELS} value={level} onChange={setLevel} size="sm" />
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            {doneBlocks.length > 0 && (
              <Button variant="secondary" size="sm" icon="download" onClick={exportAll}>
                Export all
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              icon="sparkles"
              loading={running}
              disabled={filled.length === 0}
              onClick={analyzeAll}
            >
              Analyze {filled.length || ""} block{filled.length === 1 ? "" : "s"}
            </Button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "24px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-.5px", color: "var(--t1)" }}>Batch Processing</h1>
            <p style={{ color: "var(--t3)", fontSize: 13, marginTop: 4 }}>
              Correct several text blocks at once with the same context, tone, and level.
            </p>
          </div>
          <Button variant="soft" size="sm" icon="plus" onClick={addBlock}>
            Add block
          </Button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {blocks.map((b, i) => (
            <div
              key={b.id}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--bord2)",
                borderRadius: "var(--r4)",
                boxShadow: "var(--sh1)",
                overflow: "hidden",
              }}
            >
              <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--bord2)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--t2)" }}>Block {i + 1}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {b.status === "done" && b.result && (
                    <Badge color={b.result.items.length ? "amber" : "green"} size="xs">
                      {b.result.items.length === 0
                        ? "No issues"
                        : `${b.result.items.length} fix${b.result.items.length === 1 ? "" : "es"}`}
                    </Badge>
                  )}
                  {b.status === "error" && (
                    <Badge color="red" size="xs">
                      Failed
                    </Badge>
                  )}
                  {blocks.length > 1 && (
                    <Button
                      variant="ghost"
                      size="xs"
                      icon="x"
                      title="Remove block"
                      style={{ color: "var(--t3)", padding: "4px" }}
                      onClick={() => removeBlock(b.id)}
                    />
                  )}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
                <textarea
                  value={b.input}
                  onChange={(e) => updateBlock(b.id, { input: e.target.value, status: "idle", result: null })}
                  spellCheck={false}
                  placeholder="Paste or type a text block…"
                  style={{
                    minHeight: 140,
                    padding: "16px",
                    fontSize: 14,
                    lineHeight: 1.7,
                    fontFamily: "var(--font)",
                    color: "var(--t1)",
                    border: "none",
                    borderRight: "1px solid var(--bord2)",
                    resize: "vertical",
                    outline: "none",
                    background: "transparent",
                  }}
                />
                <div style={{ padding: "16px", minHeight: 140, fontSize: 14, lineHeight: 1.7, color: "var(--t1)", whiteSpace: "pre-wrap", position: "relative" }}>
                  {b.status === "loading" ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--t3)" }}>
                      <Spinner size={16} color="var(--amber-d)" />
                      <span style={{ fontSize: 13 }}>Analyzing…</span>
                    </div>
                  ) : b.status === "done" && b.result ? (
                    <>
                      {b.result.correctedText}
                      <div style={{ position: "absolute", top: 8, right: 8 }}>
                        <Button
                          variant="ghost"
                          size="xs"
                          icon={copiedId === b.id ? "check" : "copy"}
                          onClick={() => copyBlock(b)}
                          style={copiedId === b.id ? { color: "var(--green)" } : { color: "var(--t3)" }}
                        >
                          {copiedId === b.id ? "Copied" : "Copy"}
                        </Button>
                      </div>
                    </>
                  ) : b.status === "error" ? (
                    <span style={{ color: "var(--red)", fontSize: 13 }}>Analysis failed — try again.</span>
                  ) : (
                    <span style={{ color: "var(--t4)", fontSize: 13 }}>Corrected text will appear here.</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
