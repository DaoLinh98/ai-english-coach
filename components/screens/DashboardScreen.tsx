"use client";
// components/screens/DashboardScreen.tsx — ported from prototype
// screen-dashboard.jsx, wired to real stats / activity / weekly-goal.

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge, Button, EmptyState, Icon, type IconName } from "@/components/ui";

export type DashboardStat = {
  id: string;
  label: string;
  value: number | string;
  delta: string | null;
  icon: IconName;
  color: string;
  bg: string;
};

export type DashboardActivity = {
  id: string;
  context: string;
  title: string;
  corrections: number;
  time: string;
  icon: IconName;
  color: string;
};

export type ScoreTrendPoint = {
  id: string;
  pct: number;
  date: string;
};

export type DashboardData = {
  name: string;
  stats: DashboardStat[];
  activity: DashboardActivity[];
  weeklyGoal: number;
  weeklyWords: number;
  streak: number;
  scoreTrend: ScoreTrendPoint[];
};

const QUICK_START: {
  id: string;
  label: string;
  sub: string;
  icon: IconName;
  color: string;
}[] = [
  { id: "email", label: "Email Draft", sub: "Formal & informal", icon: "mail", color: "var(--blue)" },
  { id: "slack", label: "Slack Message", sub: "Casual & professional", icon: "msg-sq", color: "var(--green)" },
  { id: "jira", label: "Jira Ticket", sub: "Technical writing", icon: "file-txt", color: "var(--purple)" },
  { id: "notes", label: "Meeting Notes", sub: "Summaries & key points", icon: "clipboard", color: "var(--orange-d)" },
];

function StatCard({ stat, delay }: { stat: DashboardStat; delay: number }) {
  const numeric = typeof stat.value === "number";
  const [count, setCount] = React.useState(numeric ? 0 : 0);

  React.useEffect(() => {
    if (!numeric) return;
    const end = stat.value as number;
    if (end <= 0) {
      setCount(0);
      return;
    }
    let start = 0;
    const inc = end / 60;
    const timer = setInterval(() => {
      start += inc;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [numeric, stat.value]);

  return (
    <div
      className={`a-up a-d${delay}`}
      style={{
        background: "var(--surface)",
        borderRadius: "var(--r4)",
        border: "1px solid var(--bord2)",
        padding: "20px 22px",
        boxShadow: "var(--sh1)",
        transition: "transform var(--base), box-shadow var(--base)",
        cursor: "default",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "var(--sh2)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "";
        e.currentTarget.style.boxShadow = "var(--sh1)";
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ width: 38, height: 38, borderRadius: "var(--r3)", background: stat.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name={stat.icon} size={18} color={stat.color} />
        </div>
        {stat.delta && (
          <Badge color={stat.id === "accuracy" ? "green" : "amber"} size="xs">
            {stat.delta} this week
          </Badge>
        )}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: "var(--t1)", lineHeight: 1, letterSpacing: "-1px" }}>
        {numeric ? count.toLocaleString() : (stat.value as string)}
      </div>
      <div style={{ fontSize: 13, color: "var(--t3)", marginTop: 4, fontWeight: 500 }}>{stat.label}</div>
    </div>
  );
}

function ActivityItem({ item }: { item: DashboardActivity }) {
  return (
    <Link
      href="/editor"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "12px 16px",
        borderRadius: "var(--r3)",
        cursor: "pointer",
        textDecoration: "none",
        transition: "background var(--fast)",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surf2)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <div style={{ width: 36, height: 36, borderRadius: "var(--r3)", background: "var(--bord2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon name={item.icon} size={16} color={item.color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="truncate" style={{ fontWeight: 600, fontSize: 13, color: "var(--t1)" }}>{item.title}</div>
        <div style={{ fontSize: 12, color: "var(--t3)", display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
          <Badge color="gray" size="xs">{item.context}</Badge>
          <span>{item.corrections} correction{item.corrections !== 1 ? "s" : ""}</span>
          <span>·</span>
          <span>{item.time}</span>
        </div>
      </div>
      <Icon name="chev-r" size={14} color="var(--t4)" />
    </Link>
  );
}

function QuickStartCard({ item }: { item: (typeof QUICK_START)[number] }) {
  return (
    <Link
      href={`/editor?context=${item.id}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "14px 16px",
        background: "var(--surface)",
        border: "1.5px solid var(--bord2)",
        borderRadius: "var(--r3)",
        cursor: "pointer",
        width: "100%",
        textDecoration: "none",
        transition: "all var(--base)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--amber)";
        e.currentTarget.style.background = "var(--amber-ll)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--bord2)";
        e.currentTarget.style.background = "var(--surface)";
      }}
    >
      <div style={{ width: 36, height: 36, borderRadius: "var(--r3)", background: "var(--bord2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon name={item.icon} size={17} color={item.color} />
      </div>
      <div style={{ textAlign: "left", flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: "var(--t1)", fontFamily: "var(--font)" }}>{item.label}</div>
        <div style={{ fontSize: 11, color: "var(--t3)", marginTop: 1 }}>{item.sub}</div>
      </div>
      <Icon name="arr-r" size={14} color="var(--t4)" />
    </Link>
  );
}

function formatTrendDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function ScoreTrendChart({ points }: { points: ScoreTrendPoint[] }) {
  if (points.length === 0) {
    return (
      <EmptyState
        icon="chart"
        title="No quiz attempts yet"
        subtitle="Take a quiz to start tracking your score trend over time."
      />
    );
  }

  // A single point still renders as a flat line so the chart never looks broken.
  const w = 600;
  const h = 160;
  const padX = 12;
  const padY = 16;
  const innerW = w - padX * 2;
  const innerH = h - padY * 2;

  const xFor = (i: number) =>
    points.length > 1 ? padX + (innerW * i) / (points.length - 1) : padX + innerW / 2;
  const yFor = (pct: number) => padY + innerH * (1 - pct / 100);

  const coords = points.map((p, i) => ({ x: xFor(i), y: yFor(p.pct), p }));
  const linePath = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x},${c.y}`).join(" ");
  const areaPath = `${linePath} L${coords[coords.length - 1].x},${padY + innerH} L${coords[0].x},${padY + innerH} Z`;

  const last = points[points.length - 1];

  return (
    <div>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        width="100%"
        height={h}
        preserveAspectRatio="none"
        role="img"
        aria-label={`Quiz score trend across ${points.length} attempt${points.length !== 1 ? "s" : ""}, most recent ${last.pct}%`}
        style={{ display: "block", overflow: "visible" }}
      >
        {/* Baseline grid */}
        <line x1={padX} y1={padY + innerH} x2={w - padX} y2={padY + innerH} stroke="var(--bord2)" strokeWidth={1} />
        <line x1={padX} y1={padY} x2={w - padX} y2={padY} stroke="var(--bord2)" strokeWidth={1} strokeDasharray="3 4" />

        <path d={areaPath} fill="var(--purp-l)" stroke="none" />
        <path d={linePath} fill="none" stroke="var(--purple)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

        {coords.map(({ x, y, p }, i) => (
          <circle key={p.id} cx={x} cy={y} r={i === coords.length - 1 ? 4.5 : 3.5} fill="var(--surface)" stroke="var(--purple)" strokeWidth={2}>
            <title>{`${formatTrendDate(p.date)}: ${p.pct}%`}</title>
          </circle>
        ))}
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11, color: "var(--t3)" }}>
        <span>{formatTrendDate(points[0].date)}</span>
        {points.length > 1 && <span>{formatTrendDate(last.date)}</span>}
      </div>
    </div>
  );
}

export function DashboardScreen({ data }: { data: DashboardData }) {
  const router = useRouter();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const goalPct = data.weeklyGoal > 0 ? Math.min(100, Math.round((data.weeklyWords / data.weeklyGoal) * 100)) : 0;

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "28px 32px 0", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-.5px", color: "var(--t1)", lineHeight: 1.2 }}>
              {greeting}, {data.name}
            </h1>
            <p style={{ color: "var(--green)", fontSize: 14, marginTop: 4 }}>
              {data.weeklyWords > 0 ? (
                <>
                  You&apos;ve improved <strong style={{ color: "var(--amber-d)" }}>{data.weeklyWords} words</strong> this week. Keep the momentum!
                </>
              ) : (
                <>Start writing to see your progress build up here.</>
              )}
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {data.streak > 0 && (
              <Badge color="amber" icon="flame">
                {data.streak}-day streak
              </Badge>
            )}
            <Button variant="primary" size="sm" icon="pen" onClick={() => router.push("/editor")}>
              Start Writing
            </Button>
          </div>
        </div>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "0 32px 32px" }}>
        {/* Stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 28 }}>
          {data.stats.map((s, i) => (
            <StatCard key={s.id} stat={s} delay={i + 1} />
          ))}
        </div>

        {/* Weekly goal banner */}
        <div
          className="a-up a-d2"
          style={{
            borderRadius: "var(--r5)",
            marginBottom: 28,
            overflow: "hidden",
            position: "relative",
            background: "linear-gradient(135deg, var(--amber) 0%, var(--orange) 55%, var(--orange-d) 100%)",
            padding: "28px 32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ position: "absolute", top: -30, right: 140, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,.08)" }} />
          <div style={{ position: "absolute", bottom: -40, right: 60, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,.06)" }} />
          <div>
            <p style={{ color: "rgba(255,255,255,.8)", fontSize: 13, fontWeight: 600, letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 6 }}>Weekly Goal Progress</p>
            <p style={{ color: "#fff", fontSize: 22, fontWeight: 800, lineHeight: 1.3, marginBottom: 12 }}>
              You&apos;re {goalPct}% toward your writing goal
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 220, height: 8, background: "rgba(255,255,255,.25)", borderRadius: 99, overflow: "hidden" }}>
                <div style={{ width: `${goalPct}%`, height: "100%", background: "#fff", borderRadius: 99, transition: "width .8s var(--ease)" }} />
              </div>
              <span style={{ color: "rgba(255,255,255,.9)", fontSize: 13, fontWeight: 600 }}>
                {data.weeklyWords} / {data.weeklyGoal} words
              </span>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.push("/editor")}
            style={{ background: "rgba(255,255,255,.2)", color: "#fff", border: "1.5px solid rgba(255,255,255,.4)", backdropFilter: "blur(8px)", flexShrink: 0 }}
          >
            Continue Writing
          </Button>
        </div>

        {/* Quiz score trend */}
        <div
          className="a-up a-d2"
          style={{
            background: "var(--surface)",
            borderRadius: "var(--r4)",
            border: "1px solid var(--bord2)",
            boxShadow: "var(--sh1)",
            padding: "18px 20px 20px",
            marginBottom: 28,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: 15, color: "var(--t1)" }}>Quiz Score Trend</p>
              <p style={{ fontSize: 12, color: "var(--t3)", marginTop: 2 }}>
                {data.scoreTrend.length > 0
                  ? `Your last ${data.scoreTrend.length} attempt${data.scoreTrend.length !== 1 ? "s" : ""}`
                  : "Track your quiz accuracy over time"}
              </p>
            </div>
            {data.scoreTrend.length > 0 && (
              <Badge color="purple" size="xs">
                Latest {data.scoreTrend[data.scoreTrend.length - 1].pct}%
              </Badge>
            )}
          </div>
          <ScoreTrendChart points={data.scoreTrend} />
        </div>

        {/* Two-column: Activity + Quick Start */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20 }}>
          {/* Recent Activity */}
          <div className="a-up a-d3" style={{ background: "var(--surface)", borderRadius: "var(--r4)", border: "1px solid var(--bord2)", boxShadow: "var(--sh1)", overflow: "hidden" }}>
            <div style={{ padding: "18px 20px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--bord2)" }}>
              <div>
                <p style={{ fontWeight: 700, fontSize: 15, color: "var(--t1)" }}>Recent Activity</p>
                <p style={{ fontSize: 12, color: "var(--t3)", marginTop: 2 }}>Your last {data.activity.length || 5} writing sessions</p>
              </div>
              <Button variant="ghost" size="xs" onClick={() => router.push("/editor")} style={{ color: "var(--t3)" }}>
                View all
              </Button>
            </div>
            <div style={{ padding: "6px 4px" }}>
              {data.activity.length > 0 ? (
                data.activity.map((item) => <ActivityItem key={item.id} item={item} />)
              ) : (
                <div style={{ padding: "32px 20px", textAlign: "center", color: "var(--t3)", fontSize: 13 }}>
                  No writing sessions yet. Head to the editor to get started.
                </div>
              )}
            </div>
          </div>

          {/* Quick Start */}
          <div className="a-up a-d4" style={{ background: "var(--surface)", borderRadius: "var(--r4)", border: "1px solid var(--bord2)", boxShadow: "var(--sh1)", overflow: "hidden" }}>
            <div style={{ padding: "18px 20px 12px", borderBottom: "1px solid var(--bord2)" }}>
              <p style={{ fontWeight: 700, fontSize: 15, color: "var(--t1)" }}>Quick Start</p>
              <p style={{ fontSize: 12, color: "var(--t3)", marginTop: 2 }}>Choose a writing context</p>
            </div>
            <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
              {QUICK_START.map((item) => (
                <QuickStartCard key={item.id} item={item} />
              ))}
            </div>
            <div style={{ padding: "10px 16px 16px" }}>
              <div style={{ background: "var(--amber-ll)", borderRadius: "var(--r3)", padding: "12px 14px", display: "flex", gap: 10, alignItems: "flex-start" }}>
                <Icon name="sparkles" size={16} color="var(--amber-d)" style={{ marginTop: 2, flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "var(--amber-dd)" }}>Pro Tip</p>
                  <p style={{ fontSize: 11, color: "var(--amber-d)", marginTop: 2, lineHeight: 1.5 }}>Paste your text and let AI suggest improvements in seconds.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
