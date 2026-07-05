"use client";
// components/screens/BatchScreen.tsx — EN→VI translator for dev communication
// (client messages, code review comments, Jira tickets, documents).

import React from "react";
import { Button, Icon, Spinner } from "@/components/ui";
import { speak } from "@/lib/tts";

type Source = "message" | "comment" | "ticket" | "document";

const SOURCES: { value: Source; label: string; icon: string; placeholder: string }[] = [
  { value: "message", label: "Message", icon: "msg-sq", placeholder: "Paste a client or colleague message to translate…" },
  { value: "comment", label: "Comment", icon: "file-txt", placeholder: "Paste a code review comment or feedback…" },
  { value: "ticket", label: "Ticket", icon: "clipboard", placeholder: "Paste a Jira ticket or task description…" },
  { value: "document", label: "Document", icon: "layers", placeholder: "Paste a technical doc or spec…" },
];

const SESSION_KEY = "translate-state";

type SavedState = { input: string; output: string; source: Source };

function loadSession(): SavedState {
  if (typeof window === "undefined") return { input: "", output: "", source: "message" };
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) return JSON.parse(raw) as SavedState;
  } catch { /* ignore */ }
  return { input: "", output: "", source: "message" };
}

export function BatchScreen() {
  const [source, setSource] = React.useState<Source>(() => loadSession().source);
  const [input, setInput] = React.useState<string>(() => loadSession().input);
  const [output, setOutput] = React.useState<string>(() => loadSession().output);
  const [loading, setLoading] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [speaking, setSpeaking] = React.useState(false);
  const [speakingInput, setSpeakingInput] = React.useState(false);
  const abortRef = React.useRef<AbortController | null>(null);

  React.useEffect(() => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ input, output, source }));
  }, [input, output, source]);

  const currentSource = SOURCES.find((s) => s.value === source)!;

  async function translate() {
    const text = input.trim();
    if (!text || loading) return;

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    setOutput("");

    try {
      const res = await fetch("/api/translate-to-vi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, source }),
        signal: ctrl.signal,
      });

      if (!res.ok || !res.body) {
        setOutput("Translation failed — please try again.");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setOutput(accumulated);
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setOutput("Translation failed — please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      translate();
    }
  }

  function copyOutput() {
    if (!output) return;
    navigator.clipboard.writeText(output).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function speakOutput() {
    speak(output, "vi-VN", {
      onStart: () => setSpeaking(true),
      onEnd: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  }

  function speakInput() {
    speak(input, "en-US", {
      onStart: () => setSpeakingInput(true),
      onEnd: () => setSpeakingInput(false),
      onError: () => setSpeakingInput(false),
    });
  }

  function clear() {
    abortRef.current?.abort();
    setInput("");
    setOutput("");
    setLoading(false);
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Toolbar */}
      <div
        style={{
          flexShrink: 0,
          borderBottom: "1px solid var(--bord2)",
          background: "var(--surface)",
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        {/* Source type chips */}
        <div style={{ display: "flex", gap: 2, background: "var(--bord2)", borderRadius: "var(--r3)", padding: 3 }}>
          {SOURCES.map((s) => (
            <button
              key={s.value}
              onClick={() => setSource(s.value)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "6px 13px",
                fontSize: 13,
                fontWeight: source === s.value ? 600 : 500,
                border: "none",
                borderRadius: "var(--r2)",
                cursor: "pointer",
                fontFamily: "var(--font)",
                background: source === s.value ? "var(--surface)" : "transparent",
                color: source === s.value ? "var(--t1)" : "var(--t3)",
                boxShadow: source === s.value ? "var(--sh1)" : "none",
                transition: "all var(--fast)",
              }}
            >
              <Icon name={s.icon} size={13} />
              {s.label}
            </button>
          ))}
        </div>

        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          {(input || output) && (
            <Button variant="ghost" size="sm" icon="x" onClick={clear} style={{ color: "var(--t3)" }}>
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Main panels */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", overflow: "hidden" }}>
        {/* Input */}
        <div style={{ display: "flex", flexDirection: "column", borderRight: "1px solid var(--bord2)", overflow: "hidden" }}>
          <div
            style={{
              padding: "10px 16px",
              borderBottom: "1px solid var(--bord2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--t3)", letterSpacing: ".04em", textTransform: "uppercase" }}>
              English
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {input && (
                <Button
                  variant="ghost"
                  size="xs"
                  icon="volume"
                  onClick={speakInput}
                  style={speakingInput ? { color: "var(--amber-d)" } : { color: "var(--t3)" }}
                >
                  Listen
                </Button>
              )}
              <span style={{ fontSize: 11, color: "var(--t4)" }}>Press Enter to translate</span>
            </div>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            placeholder={currentSource.placeholder}
            className="themed-textarea"
            style={{
              flex: 1,
              padding: "20px",
              fontSize: 14,
              lineHeight: 1.75,
              fontFamily: "var(--font)",
              color: "var(--t1)",
              border: "none",
              resize: "none",
              outline: "none",
              background: "transparent",
            }}
          />
        </div>

        {/* Output */}
        <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div
            style={{
              padding: "10px 16px",
              borderBottom: "1px solid var(--bord2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--t3)", letterSpacing: ".04em", textTransform: "uppercase" }}>
              Vietnamese
            </span>
            {output && (
              <div style={{ display: "flex", gap: 6 }}>
                <Button
                  variant="ghost"
                  size="xs"
                  icon="volume"
                  onClick={speakOutput}
                  style={speaking ? { color: "var(--amber-d)" } : { color: "var(--t3)" }}
                >
                  Listen
                </Button>
                <Button
                  variant="ghost"
                  size="xs"
                  icon={copied ? "check" : "copy"}
                  onClick={copyOutput}
                  style={copied ? { color: "var(--green)" } : { color: "var(--t3)" }}
                >
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            )}
          </div>
          <div
            style={{
              flex: 1,
              padding: "20px",
              fontSize: 14,
              lineHeight: 1.75,
              color: "var(--t1)",
              whiteSpace: "pre-wrap",
              overflowY: "auto",
              position: "relative",
            }}
          >
            {loading && !output ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--t3)" }}>
                <Spinner size={16} color="var(--amber-d)" />
                <span style={{ fontSize: 13 }}>Translating…</span>
              </div>
            ) : output ? (
              output
            ) : (
              <span style={{ color: "var(--t4)", fontSize: 13 }}>Translation will appear here.</span>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          flexShrink: 0,
          borderTop: "1px solid var(--bord2)",
          padding: "8px 24px",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Icon name="info" size={13} color="var(--t4)" />
        <span style={{ fontSize: 12, color: "var(--t4)" }}>
          Technical terms (API, PR, deploy, CI/CD…) are kept in English automatically.
        </span>
      </div>
    </div>
  );
}
