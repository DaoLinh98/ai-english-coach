export default function DashboardLoading() {
  return (
    <div style={{ height: "100%", overflowY: "auto" }}>
      {/* Header */}
      <div style={{ padding: "24px 28px 20px", borderBottom: "1px solid var(--bord2)" }}>
        <div className="skel" style={{ height: 22, width: 220, marginBottom: 8 }} />
        <div className="skel" style={{ height: 14, width: 160 }} />
      </div>

      <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Stat cards row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ background: "var(--surface)", border: "1px solid var(--bord2)", borderRadius: "var(--r4)", padding: "20px" }}>
              <div className="skel" style={{ height: 14, width: "60%", marginBottom: 12 }} />
              <div className="skel" style={{ height: 28, width: "40%", marginBottom: 8 }} />
              <div className="skel" style={{ height: 11, width: "70%" }} />
            </div>
          ))}
        </div>

        {/* Recent activity */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--bord2)", borderRadius: "var(--r4)", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--bord2)" }}>
            <div className="skel" style={{ height: 16, width: 140 }} />
          </div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={{ padding: "14px 20px", borderBottom: "1px solid var(--bord2)", display: "flex", alignItems: "center", gap: 12 }}>
              <div className="skel" style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="skel" style={{ height: 13, width: "55%", marginBottom: 6 }} />
                <div className="skel" style={{ height: 11, width: "35%" }} />
              </div>
              <div className="skel" style={{ height: 11, width: 50 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
