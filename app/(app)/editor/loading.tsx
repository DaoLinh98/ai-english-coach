export default function EditorLoading() {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Top bar */}
      <div style={{ flexShrink: 0, borderBottom: "1px solid var(--bord2)", background: "var(--surface)", padding: "12px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <div className="skel" style={{ width: 32, height: 32, borderRadius: "var(--r3)" }} />
        <div>
          <div className="skel" style={{ height: 15, width: 130, marginBottom: 5 }} />
          <div className="skel" style={{ height: 11, width: 220 }} />
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Editor area */}
        <div style={{ flex: 1, padding: "24px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="skel" style={{ flex: 1, minHeight: 300, borderRadius: "var(--r4)" }} />
          <div style={{ display: "flex", gap: 10 }}>
            <div className="skel" style={{ height: 38, width: 150, borderRadius: "var(--r3)" }} />
            <div className="skel" style={{ height: 14, width: 60, alignSelf: "center" }} />
          </div>
        </div>

      </div>
    </div>
  );
}
