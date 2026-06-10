// components/Placeholder.tsx — temporary screen stub used by Wave 0 route stubs.

export function Placeholder({ title, note }: { title: string; note: string }) {
  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
      }}
    >
      <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--t1)" }}>{title}</h1>
      <p style={{ color: "var(--t3)", fontSize: 14 }}>{note}</p>
    </div>
  );
}
