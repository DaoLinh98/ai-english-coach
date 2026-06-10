import { Sidebar } from "@/components/Sidebar";

// TODO(Wave 2): replace the demo user with the real Supabase session/profile.
const DEMO_USER = { name: "Alex Johnson", level: "Intermediate", streak: 14 };

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        background: "var(--bg)",
      }}
    >
      <Sidebar user={DEMO_USER} />
      <main style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        {children}
      </main>
    </div>
  );
}
