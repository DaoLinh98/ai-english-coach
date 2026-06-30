"use client";
// components/Sidebar.tsx — Navigation sidebar (ported from prototype app-sidebar.jsx,
// converted to route-based navigation with next/link + usePathname).

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, Avatar, Button, type IconName } from "@/components/ui";

const NAV: { id: string; icon: IconName; label: string }[] = [
  { id: "dashboard", icon: "home", label: "Dashboard" },
  { id: "editor", icon: "pen", label: "Editor" },
  { id: "batch", icon: "layers", label: "Translate" },
  { id: "flashcards", icon: "book", label: "Flashcards" },
  { id: "quiz", icon: "trophy", label: "Quiz & Progress" },
  { id: "settings", icon: "settings", label: "Settings" },
];

export type SidebarUser = {
  name: string;
  level: string;
  streak: number;
};

export function Sidebar({
  user,
  onSignOut,
}: {
  user?: SidebarUser;
  onSignOut?: () => void | Promise<void>;
}) {
  const pathname = usePathname();
  const authed = !!user;
  const [compact, setCompact] = React.useState(false);

  React.useEffect(() => {
    const h = () => setCompact(window.innerWidth < 1100);
    h();
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  const w = compact ? "var(--swc)" : "var(--sw)";
  const u = user ?? { name: "Guest", level: "Beginner", streak: 0 };

  return (
    <aside
      style={{
        width: w,
        minWidth: w,
        height: "100vh",
        flexShrink: 0,
        background: "var(--surface)",
        borderRight: "1px solid var(--bord2)",
        display: "flex",
        flexDirection: "column",
        transition: "width var(--base) var(--ease)",
        overflow: "hidden",
      }}
    >
      {/* Logo */}
      <div
        style={{
          height: 64,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          padding: compact ? "0" : "0 18px",
          gap: 10,
          borderBottom: "1px solid var(--bord2)",
          justifyContent: compact ? "center" : "flex-start",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "var(--r3)",
            flexShrink: 0,
            background: "linear-gradient(135deg, var(--amber), var(--orange))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 8px rgba(245,158,11,.35)",
          }}
        >
          <Icon name="zap" size={18} color="#fff" sw={2.2} />
        </div>
        {!compact && (
          <div>
            <div
              style={{
                fontWeight: 800,
                fontSize: 15,
                letterSpacing: "-.3px",
                color: "var(--t1)",
                lineHeight: 1.2,
              }}
            >
              EnglishCoach
            </div>
            <div style={{ fontSize: 11, color: "var(--t3)", fontWeight: 500 }}>
              AI-Powered
            </div>
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav
        style={{
          flex: 1,
          padding: "10px 8px",
          display: "flex",
          flexDirection: "column",
          gap: 2,
          overflowY: "auto",
        }}
      >
        {NAV.map((item) => {
          const href = `/${item.id}`;
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <SidebarItem
              key={item.id}
              item={item}
              href={href}
              isActive={isActive}
              compact={compact}
            />
          );
        })}
      </nav>

      {/* User profile */}
      <div
        style={{
          padding: compact ? "12px 0" : "12px 12px",
          borderTop: "1px solid var(--bord2)",
          display: "flex",
          alignItems: "center",
          gap: 10,
          justifyContent: compact ? "center" : "flex-start",
        }}
      >
        <Avatar name={u.name} size={32} />
        {!compact && (
          <>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                className="truncate"
                style={{ fontWeight: 600, fontSize: 13, color: "var(--t1)" }}
              >
                {u.name}
              </div>
              <div style={{ fontSize: 11, color: "var(--t3)" }}>
                {authed ? (
                  <>
                    {u.level}
                    {u.streak > 0 && (
                      <>
                        {" · "}
                        <span style={{ color: "var(--amber-d)" }}>
                          {u.streak} day streak
                        </span>
                      </>
                    )}
                  </>
                ) : (
                  "Not signed in"
                )}
              </div>
            </div>
            {authed ? (
              <Button
                variant="ghost"
                size="xs"
                icon="logout"
                title="Sign out"
                style={{ color: "var(--t3)", padding: "6px" }}
                onClick={() => onSignOut?.()}
              />
            ) : (
              <Link
                href="/login"
                title="Sign in"
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--amber-d)",
                  textDecoration: "none",
                  padding: "6px 10px",
                  borderRadius: "var(--r2)",
                  whiteSpace: "nowrap",
                }}
              >
                Sign in
              </Link>
            )}
          </>
        )}
      </div>
    </aside>
  );
}

function SidebarItem({
  item,
  href,
  isActive,
  compact,
}: {
  item: { id: string; icon: IconName; label: string };
  href: string;
  isActive: boolean;
  compact: boolean;
}) {
  const [hovered, setHovered] = React.useState(false);

  const bg = isActive
    ? "var(--amber-ll)"
    : hovered
      ? "var(--surf2)"
      : "transparent";
  const color = isActive ? "var(--amber-dd)" : hovered ? "var(--t1)" : "var(--t2)";

  return (
    <Link
      href={href}
      title={compact ? item.label : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: compact ? "10px 0" : "9px 12px",
        justifyContent: compact ? "center" : "flex-start",
        border: "none",
        borderRadius: "var(--r3)",
        cursor: "pointer",
        fontFamily: "var(--font)",
        fontWeight: isActive ? 600 : 500,
        fontSize: 14,
        transition: "all var(--fast)",
        background: bg,
        color: color,
        width: "100%",
        textDecoration: "none",
        boxShadow: isActive && !compact ? "inset 3px 0 0 var(--amber)" : "none",
        position: "relative",
      }}
    >
      <Icon
        name={item.icon}
        size={18}
        color={isActive ? "var(--amber-d)" : color}
      />
      {!compact && <span>{item.label}</span>}
      {isActive && !compact && (
        <span
          style={{
            position: "absolute",
            right: 10,
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "var(--amber)",
          }}
        />
      )}
    </Link>
  );
}
