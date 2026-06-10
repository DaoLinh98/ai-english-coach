import { Sidebar } from "@/components/Sidebar";
import { getSessionUser } from "@/lib/auth";
import { signOut } from "@/app/(auth)/actions";

function cap(s: string) {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionUser();
  const sidebarUser = session
    ? {
        name:
          session.profile?.name ||
          session.email?.split("@")[0] ||
          "User",
        level: cap(session.profile?.level ?? "intermediate"),
        streak: Number(session.profile?.prefs?.["streak"] ?? 0),
      }
    : undefined;

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        background: "var(--bg)",
      }}
    >
      <Sidebar user={sidebarUser} onSignOut={signOut} />
      <main style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        {children}
      </main>
    </div>
  );
}
