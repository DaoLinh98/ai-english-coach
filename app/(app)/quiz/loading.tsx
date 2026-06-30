export default function QuizLoading() {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Top bar */}
      <div style={{ flexShrink: 0, borderBottom: "1px solid var(--bord2)", background: "var(--surface)", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div className="skel" style={{ height: 16, width: 140 }} />
        <div className="skel" style={{ height: 30, width: 110, borderRadius: "var(--r3)" }} />
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "32px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
        {/* Progress */}
        <div style={{ width: "100%", maxWidth: 640 }}>
          <div className="skel" style={{ height: 6, borderRadius: "var(--rmax)", marginBottom: 6 }} />
          <div className="skel" style={{ height: 11, width: 80 }} />
        </div>

        {/* Question */}
        <div style={{ width: "100%", maxWidth: 640, background: "var(--surface)", border: "1px solid var(--bord2)", borderRadius: "var(--r4)", padding: "28px" }}>
          <div className="skel" style={{ height: 18, width: "80%", marginBottom: 10 }} />
          <div className="skel" style={{ height: 18, width: "60%" }} />
        </div>

        {/* Options */}
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ width: "100%", maxWidth: 640, background: "var(--surface)", border: "1px solid var(--bord2)", borderRadius: "var(--r4)", padding: "18px 20px" }}>
            <div className="skel" style={{ height: 14, width: `${40 + i * 10}%` }} />
          </div>
        ))}
      </div>
    </div>
  );
}
