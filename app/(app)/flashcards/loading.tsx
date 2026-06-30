export default function FlashcardsLoading() {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Top bar */}
      <div style={{ flexShrink: 0, borderBottom: "1px solid var(--bord2)", background: "var(--surface)", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 8 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skel" style={{ height: 30, width: 90, borderRadius: "var(--r3)" }} />
          ))}
        </div>
        <div className="skel" style={{ height: 30, width: 120, borderRadius: "var(--r3)" }} />
      </div>

      {/* Card */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <div style={{ width: "100%", maxWidth: 520 }}>
          <div className="skel" style={{ height: 300, borderRadius: "var(--r5)", marginBottom: 24 }} />
          {/* Progress bar */}
          <div className="skel" style={{ height: 6, borderRadius: "var(--rmax)", marginBottom: 20 }} />
          {/* Buttons */}
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <div className="skel" style={{ height: 42, width: 130, borderRadius: "var(--r3)" }} />
            <div className="skel" style={{ height: 42, width: 130, borderRadius: "var(--r3)" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
