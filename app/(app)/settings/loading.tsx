export default function SettingsLoading() {
  return (
    <div style={{ height: "100%", overflowY: "auto" }}>
      {/* Header */}
      <div style={{ padding: "24px 28px 20px", borderBottom: "1px solid var(--bord2)" }}>
        <div className="skel" style={{ height: 20, width: 100, marginBottom: 6 }} />
        <div className="skel" style={{ height: 13, width: 220 }} />
      </div>

      <div style={{ padding: "28px", display: "flex", flexDirection: "column", gap: 24, maxWidth: 680 }}>
        {/* Profile section */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--bord2)", borderRadius: "var(--r4)", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--bord2)" }}>
            <div className="skel" style={{ height: 15, width: 90 }} />
          </div>
          <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Avatar row */}
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div className="skel" style={{ width: 64, height: 64, borderRadius: "50%" }} />
              <div>
                <div className="skel" style={{ height: 28, width: 110, borderRadius: "var(--r3)", marginBottom: 6 }} />
                <div className="skel" style={{ height: 11, width: 180 }} />
              </div>
            </div>
            {/* Name + level fields */}
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <div className="skel" style={{ height: 12, width: 70, marginBottom: 8 }} />
                <div className="skel" style={{ height: 40, borderRadius: "var(--r3)" }} />
              </div>
            ))}
          </div>
        </div>

        {/* Stats section */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--bord2)", borderRadius: "var(--r4)", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--bord2)" }}>
            <div className="skel" style={{ height: 15, width: 110 }} />
          </div>
          <div style={{ padding: "20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={{ background: "var(--surf2)", borderRadius: "var(--r3)", padding: "14px 16px" }}>
                <div className="skel" style={{ height: 12, width: "50%", marginBottom: 8 }} />
                <div className="skel" style={{ height: 24, width: "40%" }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
