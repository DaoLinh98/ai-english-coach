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

        {/* Vocabulary panel */}
        <div style={{ width: 300, flexShrink: 0, borderLeft: "1px solid var(--bord2)", background: "var(--surf2)", padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ padding: "2px 4px 10px" }}>
            <div className="skel" style={{ height: 14, width: 90, marginBottom: 6 }} />
            <div className="skel" style={{ height: 11, width: 180 }} />
          </div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={{ background: "var(--surface)", borderRadius: "var(--r3)", border: "1px solid var(--bord2)", padding: "10px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div className="skel" style={{ height: 14, width: "50%" }} />
              <div className="skel" style={{ height: 26, width: 56, borderRadius: "var(--r2)" }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
