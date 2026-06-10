"use client";
// components/ui.tsx — Shared UI primitives (ported from prototype app-components.jsx)

import React from "react";

type CSS = React.CSSProperties;

// ── Icon paths (Lucide-compatible SVG) ────────────────────────────────────────
const IP: Record<string, string[]> = {
  home: ["M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z", "M9 22V12h6v10"],
  pen: ["M12 20h9", "M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 9.5-9.5z"],
  book: [
    "M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z",
    "M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 0 3-3h7z",
  ],
  trophy: [
    "M6 9H4.5a2.5 2.5 0 0 0 0 5H6",
    "M18 9h1.5a2.5 2.5 0 0 1 0 5H18",
    "M4 22h16",
    "M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22",
    "M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22",
    "M18 2H6v7a6 6 0 0 0 12 0V2z",
  ],
  settings: [
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
    "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
  ],
  user: [
    "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2",
    "M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  ],
  zap: ["M13 2L3 14h9l-1 8 10-12h-9l1-8z"],
  check: ["M20 6L9 17l-5-5"],
  x: ["M18 6L6 18", "M6 6l12 12"],
  "chev-r": ["M9 18l6-6-6-6"],
  "chev-l": ["M15 18l-6-6 6-6"],
  "chev-d": ["M6 9l6 6 6-6"],
  plus: ["M12 5v14", "M5 12h14"],
  search: ["M11 17a6 6 0 1 0 0-12 6 6 0 0 0 0 12z", "M21 21l-4.35-4.35"],
  flame: [
    "M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z",
  ],
  "trend-up": ["M23 6l-9.5 9.5-5-5L1 18", "M17 6h6v6"],
  mail: [
    "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z",
    "M22 6l-10 7L2 6",
  ],
  "msg-sq": ["M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"],
  "file-txt": [
    "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z",
    "M14 2v6h6",
    "M16 13H8",
    "M16 17H8",
    "M10 9H8",
  ],
  clipboard: [
    "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2",
    "M9 2h6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z",
  ],
  refresh: [
    "M21 2v6h-6",
    "M3 12a9 9 0 0 1 15-6.7L21 8",
    "M3 22v-6h6",
    "M21 12a9 9 0 0 1-15 6.7L3 16",
  ],
  copy: [
    "M20 9H11a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2z",
    "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1",
  ],
  "arr-r": ["M5 12h14", "M12 5l7 7-7 7"],
  info: ["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z", "M12 8h.01", "M11 12h1v4h1"],
  star: [
    "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  ],
  rotate: ["M23 4v6h-6", "M20.49 15a9 9 0 1 1-2.12-9.36L23 10"],
  chart: ["M18 20V10", "M12 20V4", "M6 20v-6"],
  award: [
    "M12 15a7 7 0 1 0 0-14 7 7 0 0 0 0 14z",
    "M8.21 13.89L7 23l5-3 5 3-1.21-9.12",
  ],
  sliders: [
    "M4 21v-7",
    "M4 10V3",
    "M12 21v-9",
    "M12 8V3",
    "M20 21v-5",
    "M20 12V3",
    "M1 14h6",
    "M9 8h6",
    "M17 16h6",
  ],
  sparkles: [
    "M12 3l1.5 3.5 3.5 1.5-3.5 1.5L12 13l-1.5-3.5L7 8l3.5-1.5z",
    "M19 9l.75 1.5 1.5.75-1.5.75L19 13.5l-.75-1.5-1.5-.75 1.5-.75z",
    "M5 15l.75 1.5 1.5.75-1.5.75L5 19.5l-.75-1.5-1.5-.75 1.5-.75z",
  ],
  "thu-u": [
    "M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z",
    "M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3",
  ],
  "thu-d": [
    "M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z",
    "M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17",
  ],
  bell: [
    "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9",
    "M13.73 21a2 2 0 0 1-3.46 0",
  ],
  logout: ["M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", "M16 17l5-5-5-5", "M21 12H9"],
  target: [
    "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z",
    "M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12z",
    "M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  ],
  layers: ["M12 2L2 7l10 5 10-5-10-5z", "M2 17l10 5 10-5", "M2 12l10 5 10-5"],
  "grad-cap": ["M22 10v6", "M2 10l10-5 10 5-10 5z", "M6 12v5c3 3 9 3 12 0v-5"],
  download: ["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", "M7 10l5 5 5-5", "M12 15V3"],
  eye: [
    "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z",
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  ],
  filter: ["M22 3H2l8 9.46V19l4 2v-8.54L22 3z"],
  "alert-t": [
    "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z",
    "M12 9v4",
    "M12 17h.01",
  ],
};

export type IconName = keyof typeof IP | string;

export function Icon({
  name,
  size = 18,
  color = "currentColor",
  sw = 1.8,
  style,
  className,
}: {
  name: IconName;
  size?: number;
  color?: string;
  sw?: number;
  style?: CSS;
  className?: string;
}) {
  const paths = IP[name];
  if (!paths)
    return (
      <span style={{ width: size, height: size, display: "inline-block" }} />
    );
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      className={className}
    >
      {paths.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}

export function Spinner({
  size = 16,
  color = "currentColor",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.5"
      style={{ animation: "spin .7s linear infinite", flexShrink: 0 }}
    >
      <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
    </svg>
  );
}

// ── Button ────────────────────────────────────────────────────────────────────
type BtnSize = "xs" | "sm" | "md" | "lg";
type BtnVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "soft"
  | "outline"
  | "ghost-amber";

const btnSz: Record<BtnSize, { fs: number; p: string; g: number; is: number }> = {
  xs: { fs: 12, p: "4px 10px", g: 4, is: 12 },
  sm: { fs: 13, p: "6px 14px", g: 5, is: 13 },
  md: { fs: 14, p: "9px 18px", g: 6, is: 14 },
  lg: { fs: 15, p: "12px 26px", g: 7, is: 16 },
};
const btnVar: Record<BtnVariant, CSS> = {
  primary: { background: "var(--amber)", color: "#fff", border: "none" },
  secondary: {
    background: "var(--surface)",
    color: "var(--t1)",
    border: "1.5px solid var(--border)",
  },
  ghost: { background: "transparent", color: "var(--t2)", border: "none" },
  danger: { background: "var(--red)", color: "#fff", border: "none" },
  soft: {
    background: "var(--amber-ll)",
    color: "var(--amber-dd)",
    border: "none",
  },
  outline: {
    background: "transparent",
    color: "var(--amber-d)",
    border: "1.5px solid var(--amber)",
  },
  "ghost-amber": {
    background: "transparent",
    color: "var(--amber-d)",
    border: "none",
  },
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  icon,
  iconRight,
  loading,
  disabled,
  onClick,
  style,
  full,
  title,
}: {
  children?: React.ReactNode;
  variant?: BtnVariant;
  size?: BtnSize;
  icon?: IconName;
  iconRight?: IconName;
  loading?: boolean;
  disabled?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  style?: CSS;
  full?: boolean;
  title?: string;
}) {
  const sz = btnSz[size] || btnSz.md;
  const vr = btnVar[variant] || btnVar.primary;
  return (
    <button
      title={title}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: sz.g,
        fontFamily: "var(--font)",
        fontWeight: 600,
        cursor: disabled || loading ? "not-allowed" : "pointer",
        borderRadius: "var(--r3)",
        transition: "all var(--base) var(--ease)",
        opacity: disabled || loading ? 0.55 : 1,
        fontSize: sz.fs,
        padding: sz.p,
        lineHeight: 1.4,
        width: full ? "100%" : undefined,
        textDecoration: "none",
        ...vr,
        ...style,
      }}
      onClick={disabled || loading ? undefined : onClick}
      disabled={disabled || loading}
    >
      {loading ? (
        <Spinner size={sz.is} color={(vr.color as string) || "#fff"} />
      ) : icon ? (
        <Icon name={icon} size={sz.is} />
      ) : null}
      {children}
      {!loading && iconRight ? <Icon name={iconRight} size={sz.is} /> : null}
    </button>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────
type BadgeColor =
  | "amber"
  | "red"
  | "green"
  | "blue"
  | "purple"
  | "gray"
  | "orange";

const badgeCols: Record<BadgeColor, CSS> = {
  amber: { background: "var(--amber-l)", color: "var(--amber-dd)" },
  red: { background: "var(--red-l)", color: "var(--red)" },
  green: { background: "var(--green-l)", color: "var(--green)" },
  blue: { background: "var(--blue-l)", color: "var(--blue)" },
  purple: { background: "var(--purp-l)", color: "var(--purple)" },
  gray: { background: "var(--bord2)", color: "var(--t2)" },
  orange: { background: "#FFF7ED", color: "var(--orange-d)" },
};
export function Badge({
  children,
  color = "gray",
  icon,
  dot,
  size = "sm",
}: {
  children?: React.ReactNode;
  color?: BadgeColor;
  icon?: IconName;
  dot?: boolean;
  size?: "xs" | "sm";
}) {
  const col = badgeCols[color] || badgeCols.gray;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        ...col,
        borderRadius: "var(--rmax)",
        fontSize: size === "xs" ? 11 : 12,
        fontWeight: 600,
        lineHeight: 1,
        padding: size === "xs" ? "3px 7px" : "4px 9px",
        whiteSpace: "nowrap",
      }}
    >
      {dot && (
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: "currentColor",
          }}
        />
      )}
      {icon && <Icon name={icon} size={10} />}
      {children}
    </span>
  );
}

// ── ProgressBar ───────────────────────────────────────────────────────────────
export function ProgressBar({
  value = 0,
  max = 100,
  color = "var(--amber)",
  height = 6,
}: {
  value?: number;
  max?: number;
  color?: string;
  height?: number;
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div
      style={{
        width: "100%",
        height,
        background: "var(--bord2)",
        borderRadius: "var(--rmax)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${pct}%`,
          height: "100%",
          background: color,
          borderRadius: "var(--rmax)",
          transition: "width .5s var(--ease)",
        }}
      />
    </div>
  );
}

// ── Avatar ────────────────────────────────────────────────────────────────────
export function Avatar({ name = "?", size = 36 }: { name?: string; size?: number }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        flexShrink: 0,
        background: "linear-gradient(135deg,var(--amber),var(--orange))",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.36,
        fontWeight: 700,
        color: "#fff",
      }}
    >
      {initials}
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({
  children,
  style,
  className,
  onClick,
  padding = "20px",
}: {
  children?: React.ReactNode;
  style?: CSS;
  className?: string;
  onClick?: () => void;
  padding?: string;
}) {
  return (
    <div
      className={`lift ${className || ""}`}
      onClick={onClick}
      style={{
        background: "var(--surface)",
        borderRadius: "var(--r4)",
        boxShadow: "var(--sh1)",
        border: "1px solid var(--bord2)",
        padding,
        ...style,
        cursor: onClick ? "pointer" : undefined,
      }}
    >
      {children}
    </div>
  );
}

// ── Toggle ────────────────────────────────────────────────────────────────────
export function Toggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div
      onClick={() => onChange(!value)}
      style={{
        width: 42,
        height: 24,
        borderRadius: 12,
        cursor: "pointer",
        background: value ? "var(--amber)" : "var(--border)",
        transition: "background var(--base)",
        position: "relative",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 3,
          left: value ? 19 : 3,
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: "#fff",
          boxShadow: "var(--sh1)",
          transition: "left var(--base) var(--spring)",
        }}
      />
    </div>
  );
}

// ── Divider ───────────────────────────────────────────────────────────────────
export function Divider({ my = 16 }: { my?: number }) {
  return <div style={{ height: 1, background: "var(--bord2)", margin: `${my}px 0` }} />;
}

// ── EmptyState ────────────────────────────────────────────────────────────────
export function EmptyState({
  icon,
  title,
  subtitle,
  action,
}: {
  icon?: IconName;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "48px 24px",
        gap: 14,
      }}
    >
      <div
        style={{
          width: 60,
          height: 60,
          borderRadius: "var(--r4)",
          background: "var(--amber-ll)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon name={icon || "info"} size={26} color="var(--amber-d)" />
      </div>
      <p style={{ fontWeight: 700, fontSize: 16, color: "var(--t1)" }}>{title}</p>
      {subtitle && (
        <p style={{ color: "var(--t3)", fontSize: 13, maxWidth: 280 }}>{subtitle}</p>
      )}
      {action}
    </div>
  );
}

// ── Segmented ─────────────────────────────────────────────────────────────────
export type SegOption<T extends string = string> = {
  value: T;
  label: string;
  icon?: IconName;
};
export function Segmented<T extends string = string>({
  options,
  value,
  onChange,
  size = "md",
}: {
  options: SegOption<T>[];
  value: T;
  onChange: (v: T) => void;
  size?: "sm" | "md";
}) {
  return (
    <div
      style={{
        display: "inline-flex",
        background: "var(--bord2)",
        borderRadius: "var(--r3)",
        padding: 3,
        gap: 2,
      }}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: size === "sm" ? "5px 11px" : "6px 14px",
              fontSize: size === "sm" ? 12 : 13,
              fontWeight: active ? 600 : 500,
              border: "none",
              borderRadius: "var(--r2)",
              cursor: "pointer",
              fontFamily: "var(--font)",
              background: active ? "var(--surface)" : "transparent",
              color: active ? "var(--t1)" : "var(--t3)",
              boxShadow: active ? "var(--sh1)" : "none",
              transition: "all var(--fast)",
            }}
          >
            {o.icon && <Icon name={o.icon} size={12} />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
