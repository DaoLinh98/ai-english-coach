export default function BatchLoading() {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Top bar */}
      <div style={{ flexShrink: 0, borderBottom: "1px solid var(--bord2)", background: "var(--surface)", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div className="skel" style={{ height: 16, width: 160, marginBottom: 6 }} />
          <div className="skel" style={{ height: 11, width: 240 }} />
        </div>
        <div className="skel" style={{ height: 34, width: 130, borderRadius: "var(--r3)" }} />
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: 16 }}>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ background: "var(--surface)", border: "1px solid var(--bord2)", borderRadius: "var(--r4)", overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--bord2)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div className="skel" style={{ height: 13, width: 80 }} />
              <div className="skel" style={{ height: 26, width: 90, borderRadius: "var(--r3)" }} />
            </div>
            <div style={{ padding: "16px" }}>
              <div className="skel" style={{ height: 80, borderRadius: "var(--r2)" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
