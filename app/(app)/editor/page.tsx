"use client";

import React from "react";
import { Button, Icon, Segmented, Spinner } from "@/components/ui";
import type { ChangeExplanation } from "@/lib/ai/schema";
import { speak } from "@/lib/tts";

type Mode = "input" | "loading" | "result";
type ResultView = "inline" | "compare";

interface EditorState {
  inputText: string;
  translatedText: string;
  mode: Mode;
}

const SESSION_KEY = "editorState";

function loadSession(): Partial<EditorState> {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) return JSON.parse(raw) as Partial<EditorState>;
  } catch { }
  return {};
}

function saveSession(state: EditorState) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
  } catch { }
}


export default function EditorPage() {
  // Deterministic defaults on both server and client so SSR markup matches
  // the pre-hydration client render; sessionStorage is only read after
  // mount (see the hydrate effect below), since it doesn't exist on the
  // server and reading it in a useState initializer causes a hydration
  // mismatch whenever a previous session left `mode: "result"` saved.
  const [inputText, setInputText] = React.useState<string>("");
  const [translatedText, setTranslatedText] = React.useState<string>("");
  const [mode, setMode] = React.useState<Mode>("input");
  const [toast, setToast] = React.useState<string | null>(null);
  const [narrow, setNarrow] = React.useState(false);
  const [copyDone, setCopyDone] = React.useState(false);
  const [speaking, setSpeaking] = React.useState(false);
  const [explanations, setExplanations] = React.useState<ChangeExplanation[]>([]);
  const [explanationsLoading, setExplanationsLoading] = React.useState(false);
  const [expandedExplanation, setExpandedExplanation] = React.useState<number | null>(null);
  const [resultView, setResultView] = React.useState<ResultView>("inline");
  const [hydrated, setHydrated] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    const h = () => setNarrow(window.innerWidth < 960);
    h();
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  // Restore any saved session client-side, after mount — reading
  // sessionStorage during render (e.g. in a useState initializer) would
  // desync the SSR and hydration trees.
  React.useEffect(() => {
    const saved = loadSession();
    if (saved.inputText) setInputText(saved.inputText);
    if (saved.translatedText) setTranslatedText(saved.translatedText);
    if (saved.mode && saved.mode !== "loading") setMode(saved.mode);
    setHydrated(true);
  }, []);

  // Persist session on change (skipped until the restore above has run, so
  // it doesn't overwrite the saved session with the pre-hydration defaults).
  React.useEffect(() => {
    if (!hydrated) return;
    saveSession({ inputText, translatedText, mode });
  }, [hydrated, inputText, translatedText, mode]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  async function handleTranslate() {
    const text = inputText.trim();
    if (!text) return;

    setMode("loading");
    setTranslatedText("");
    setExplanations([]);
    setExpandedExplanation(null);
    setResultView("inline");

    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!res.ok || !res.body) {
        setMode("input");
        showToast("Translation failed — please try again.");
        return;
      }

      // Switch to the result view before reading the body so the translation
      // appears token by token as the model produces it. Buffering the whole
      // response first (res.text()) would hold the spinner for the entire
      // generation even though the route streams.
      setMode("result");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setTranslatedText(full);
      }
      full += decoder.decode();
      setTranslatedText(full);
    } catch {
      setMode("input");
      showToast("Translation failed — please try again.");
    }
  }

  function handleReset() {
    setMode("input");
    setTranslatedText("");
    setExplanations([]);
    setExpandedExplanation(null);
    setResultView("inline");
    try { sessionStorage.removeItem(SESSION_KEY); } catch { }
  }

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape" || mode === "loading") return;
      setInputText("");
      handleReset();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mode]);

  React.useEffect(() => {
    if (mode === "input") textareaRef.current?.focus();
  }, [mode]);

  function handleCopy() {
    navigator.clipboard.writeText(translatedText).catch(() => { });
    setCopyDone(true);
    setTimeout(() => setCopyDone(false), 1500);
  }

  function handleSpeak() {
    speak(translatedText, "en-US", {
      onStart: () => setSpeaking(true),
      onEnd: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  }

  const wordCount = inputText.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Top bar */}
      <div style={{ flexShrink: 0, borderBottom: "1px solid var(--bord2)", background: "var(--surface)", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: "var(--r3)", background: "linear-gradient(135deg, var(--amber), var(--orange))", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="sparkles" size={15} color="#fff" />
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: 15, color: "var(--t1)", lineHeight: 1.2 }}>Translate &amp; Fix</p>
            <p style={{ fontSize: 11, color: "var(--t3)" }}>Paste Vietnamese or mixed text — get fluent English</p>
          </div>
        </div>
        {mode === "result" && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Segmented
              size="sm"
              value={resultView}
              onChange={setResultView}
              options={[
                { value: "inline", label: "Inline", icon: "file-txt" },
                { value: "compare", label: "Compare", icon: "columns" },
              ]}
            />
            <Button variant="ghost" size="sm" icon="volume" onClick={handleSpeak} style={speaking ? { color: "var(--amber-d)" } : {}}>
              Listen
            </Button>
            <Button variant="secondary" size="sm" icon={copyDone ? "check" : "copy"} onClick={handleCopy} style={copyDone ? { color: "var(--green)" } : {}}>
              {copyDone ? "Copied!" : "Copy"}
            </Button>
            <Button variant="ghost" size="sm" icon="refresh" onClick={handleReset}>
              Reset
            </Button>
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: "flex", flexDirection: narrow ? "column" : "row", overflow: "hidden" }}>
        {/* Main editor / result area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", padding: "24px" }}>
          {(mode === "input" || mode === "loading") && (
            <div className="a-up" style={{ height: "100%", display: "flex", flexDirection: "column", gap: 16 }}>
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                spellCheck={false}
                placeholder="Paste or type your text here…"
                disabled={mode === "loading"}
                style={{
                  flex: 1,
                  minHeight: 300,
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
                  opacity: mode === "loading" ? 0.5 : 1,
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--amber)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (inputText.trim() && mode !== "loading") handleTranslate();
                  }
                }}
              />
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Button
                  variant="primary"
                  size="md"
                  icon="sparkles"
                  onClick={handleTranslate}
                  loading={mode === "loading"}
                  disabled={!inputText.trim() || mode === "loading"}
                >
                  {mode === "loading" ? "Translating…" : "Translate & Fix"}
                </Button>
                <span style={{ fontSize: 12, color: "var(--t3)" }}>{wordCount} words</span>
              </div>
            </div>
          )}

          {mode === "result" && (
            <div className="a-up" style={{ height: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
              {resultView === "inline" ? (
                <>
                  {/* Original (expanded by default) */}
                  <details open style={{ flexShrink: 0 }}>
                    <summary style={{ fontSize: 12, fontWeight: 600, color: "var(--t3)", cursor: "pointer", userSelect: "none", padding: "4px 0" }}>
                      Original text
                    </summary>
                    <div style={{ marginTop: 8, padding: "14px 16px", background: "var(--surf2)", borderRadius: "var(--r3)", border: "1px solid var(--bord2)", fontSize: 14, color: "var(--t3)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                      {inputText}
                    </div>
                  </details>

                  {/* Translated result */}
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--green)", display: "inline-block" }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--t2)", textTransform: "uppercase", letterSpacing: ".4px" }}>English Result</span>
                    </div>
                    <div
                      style={{
                        flex: 1,
                        padding: "20px",
                        fontSize: 15,
                        lineHeight: 1.9,
                        color: "var(--t1)",
                        fontFamily: "var(--font)",
                        background: "var(--surface)",
                        border: "1.5px solid var(--bord2)",
                        borderRadius: "var(--r4)",
                        overflowY: "auto",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {translatedText}
                      {/* blinking cursor while streaming */}
                      {mode === "result" && translatedText.length > 0 && (
                        <span className="stream-cursor" />
                      )}
                    </div>
                  </div>
                </>
              ) : (
                /* Compare view: original vs corrected side by side (stacked on narrow viewports) */
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: narrow ? "column" : "row",
                    gap: 12,
                    minHeight: 0,
                  }}
                >
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, minHeight: narrow ? 180 : undefined }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--t3)", display: "inline-block" }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--t2)", textTransform: "uppercase", letterSpacing: ".4px" }}>Original</span>
                    </div>
                    <div
                      style={{
                        flex: 1,
                        padding: "20px",
                        fontSize: 15,
                        lineHeight: 1.9,
                        color: "var(--t3)",
                        fontFamily: "var(--font)",
                        background: "var(--surf2)",
                        border: "1.5px solid var(--bord2)",
                        borderRadius: "var(--r4)",
                        overflowY: "auto",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {inputText}
                    </div>
                  </div>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, minHeight: narrow ? 180 : undefined }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--green)", display: "inline-block" }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--t2)", textTransform: "uppercase", letterSpacing: ".4px" }}>Corrected</span>
                    </div>
                    <div
                      style={{
                        flex: 1,
                        padding: "20px",
                        fontSize: 15,
                        lineHeight: 1.9,
                        color: "var(--t1)",
                        fontFamily: "var(--font)",
                        background: "var(--surface)",
                        border: "1.5px solid var(--green)",
                        borderRadius: "var(--r4)",
                        overflowY: "auto",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {translatedText}
                      {mode === "result" && translatedText.length > 0 && (
                        <span className="stream-cursor" />
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Grammar notes: per-mistake explanations */}
              {(explanationsLoading || explanations.length > 0) && (
                <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--t2)", textTransform: "uppercase", letterSpacing: ".4px" }}>
                    Grammar Notes
                  </span>
                  {explanationsLoading && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--t3)", padding: "4px 0" }}>
                      <Spinner size={14} color="var(--amber)" />
                      <span style={{ fontSize: 12 }}>Analysing what changed…</span>
                    </div>
                  )}
                  {explanations.map((item, i) => {
                    const expanded = expandedExplanation === i;
                    return (
                      <div
                        key={i}
                        style={{
                          border: "1px solid var(--bord2)",
                          borderRadius: "var(--r3)",
                          background: "var(--surface)",
                          overflow: "hidden",
                        }}
                      >
                        <button
                          onClick={() => setExpandedExplanation(expanded ? null : i)}
                          style={{
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 10,
                            padding: "10px 14px",
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            fontFamily: "var(--font)",
                            textAlign: "left",
                          }}
                        >
                          <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--t1)" }}>{item.label}</span>
                            <span style={{ fontSize: 12, color: "var(--t3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              &quot;{item.text}&quot;
                            </span>
                          </span>
                          <span style={{ display: "flex", transform: expanded ? "rotate(180deg)" : "none", transition: "transform var(--fast)" }}>
                            <Icon name="chev-d" size={14} color="var(--t3)" />
                          </span>
                        </button>
                        {expanded && (
                          <div style={{ padding: "0 14px 12px", fontSize: 13, color: "var(--t2)", lineHeight: 1.6 }}>
                            <p style={{ fontWeight: 600, color: "var(--amber-d)", marginBottom: 4 }}>{item.rule}</p>
                            <p>{item.expl}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <Button variant="ghost" size="sm" onClick={handleReset} style={{ alignSelf: "flex-start" }}>
                ← Edit original
              </Button>
            </div>
          )}
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
            color: "var(--bg)",
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
