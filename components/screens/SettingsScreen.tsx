"use client";
// components/screens/SettingsScreen.tsx — ported from prototype screen-settings.jsx,
// wired to Supabase profile + preferred-vocabulary via Server Actions.

import React from "react";
import { Avatar, Button, Icon, Segmented, Toggle, type IconName } from "@/components/ui";
import type { Profile } from "@/lib/auth";
import type { ProfilePatch } from "@/app/(app)/settings/actions";
import { exportLearningData } from "@/lib/export";

const GOALS = [
  "Email writing",
  "Technical documentation",
  "Slack & chat",
  "Meeting notes",
  "Jira & tickets",
  "Presentations",
];

type Prefs = {
  autoAnalyze: boolean;
  showExplain: boolean;
  contextVocab: boolean;
  saveToFlashcards: boolean;
  reminders: boolean;
  weeklyReport: boolean;
  newCardSuggest: boolean;
  achievements: boolean;
};

const DEFAULT_PREFS: Prefs = {
  autoAnalyze: true,
  showExplain: true,
  contextVocab: true,
  saveToFlashcards: true,
  reminders: false,
  weeklyReport: true,
  newCardSuggest: true,
  achievements: true,
};

function SettingRow({
  label,
  sub,
  control,
  topBorder = true,
}: {
  label: string;
  sub?: string;
  control: React.ReactNode;
  topBorder?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        padding: "16px 0",
        borderTop: topBorder ? "1px solid var(--bord2)" : "none",
      }}
    >
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: "var(--t1)" }}>{label}</p>
        {sub && <p style={{ fontSize: 12, color: "var(--t3)", marginTop: 2 }}>{sub}</p>}
      </div>
      <div style={{ flexShrink: 0 }}>{control}</div>
    </div>
  );
}

function SectionCard({
  title,
  sub,
  children,
}: {
  title: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "var(--surface)",
        borderRadius: "var(--r4)",
        border: "1px solid var(--bord2)",
        boxShadow: "var(--sh1)",
        marginBottom: 20,
        overflow: "hidden",
      }}
    >
      <div style={{ padding: "18px 22px 14px", borderBottom: "1px solid var(--bord2)" }}>
        <p style={{ fontWeight: 700, fontSize: 15, color: "var(--t1)" }}>{title}</p>
        {sub && <p style={{ fontSize: 12, color: "var(--t3)", marginTop: 3 }}>{sub}</p>}
      </div>
      <div style={{ padding: "0 22px 8px" }}>{children}</div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "8px 12px",
  fontSize: 13,
  border: "1.5px solid var(--border)",
  borderRadius: "var(--r2)",
  fontFamily: "var(--font)",
  color: "var(--t1)",
  outline: "none",
  width: 240,
  background: "var(--surface)",
};

export function SettingsScreen({
  email,
  profile,
  vocab,
  stats,
  updateProfile,
  addVocab,
  removeVocab,
  requestPasswordReset,
  signOut,
}: {
  email: string;
  profile: Profile | null;
  vocab: string[];
  stats: { streak: number; totalWords: number; accuracy: number | null };
  updateProfile: (patch: ProfilePatch) => Promise<void>;
  addVocab: (term: string) => Promise<void>;
  removeVocab: (term: string) => Promise<void>;
  requestPasswordReset: () => Promise<void>;
  signOut: () => Promise<void>;
}) {
  const [tab, setTab] = React.useState<"profile" | "learning" | "goals" | "account">("profile");
  const [name, setName] = React.useState(profile?.name ?? "");
  const [level, setLevel] = React.useState(profile?.level ?? "intermediate");
  const [style_, setStyle_] = React.useState(profile?.preferred_style ?? "professional");
  const [goals, setGoals] = React.useState<Set<string>>(
    new Set(profile?.learning_goals ?? []),
  );
  const [weeklyGoal, setWeeklyGoal] = React.useState(profile?.weekly_goal ?? 100);
  const [prefs, setPrefs] = React.useState<Prefs>({
    ...DEFAULT_PREFS,
    ...((profile?.prefs as Partial<Prefs>) ?? {}),
  });
  const [vocabList, setVocabList] = React.useState<string[]>(vocab);
  const [newWord, setNewWord] = React.useState("");
  const [saved, setSaved] = React.useState(false);
  const [pwMsg, setPwMsg] = React.useState<string | null>(null);
  const [, startTransition] = React.useTransition();

  const TABS: { id: typeof tab; icon: IconName; label: string }[] = [
    { id: "profile", icon: "user", label: "Profile" },
    { id: "learning", icon: "grad-cap", label: "Learning" },
    { id: "goals", icon: "target", label: "Goals" },
    { id: "account", icon: "bell", label: "Notifications" },
  ];

  function toggleGoal(g: string) {
    setGoals((prev) => {
      const next = new Set(prev);
      if (next.has(g)) next.delete(g);
      else next.add(g);
      return next;
    });
  }

  function setPref<K extends keyof Prefs>(k: K, v: Prefs[K]) {
    setPrefs((p) => ({ ...p, [k]: v }));
  }

  function handleSave() {
    startTransition(async () => {
      await updateProfile({
        name,
        level,
        preferred_style: style_,
        learning_goals: [...goals],
        weekly_goal: weeklyGoal,
        prefs,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  function handleAddWord() {
    const w = newWord.trim();
    if (!w || vocabList.includes(w)) return;
    setVocabList((l) => [...l, w]);
    setNewWord("");
    startTransition(() => addVocab(w));
  }

  function handleRemoveWord(w: string) {
    setVocabList((l) => l.filter((x) => x !== w));
    startTransition(() => removeVocab(w));
  }

  function handleChangePassword() {
    setPwMsg(null);
    startTransition(async () => {
      try {
        await requestPasswordReset();
        setPwMsg("Reset link sent to your email");
      } catch {
        setPwMsg("Couldn't send reset link — try again");
      }
      setTimeout(() => setPwMsg(null), 4000);
    });
  }

  function handleExportData() {
    exportLearningData({
      email,
      name,
      level,
      preferredStyle: style_,
      weeklyGoal,
      learningGoals: [...goals],
      vocabulary: vocabList,
      stats,
      prefs: prefs as unknown as Record<string, boolean>,
    });
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "28px 32px 0", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-.5px", color: "var(--t1)", lineHeight: 1.2 }}>
              Settings
            </h1>
            <p style={{ color: "var(--t3)", fontSize: 14, marginTop: 4 }}>
              Manage your profile, preferences, and learning goals
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            icon={saved ? "check" : "download"}
            onClick={handleSave}
            style={saved ? { background: "var(--green)" } : {}}
          >
            {saved ? "Saved!" : "Save Changes"}
          </Button>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: 2,
            background: "var(--bord2)",
            borderRadius: "var(--r3)",
            padding: 4,
            width: "fit-content",
            marginBottom: 20,
          }}
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 16px",
                fontSize: 13,
                fontWeight: tab === t.id ? 600 : 500,
                border: "none",
                borderRadius: "var(--r2)",
                cursor: "pointer",
                fontFamily: "var(--font)",
                background: tab === t.id ? "var(--surface)" : "transparent",
                color: tab === t.id ? "var(--t1)" : "var(--t3)",
                boxShadow: tab === t.id ? "var(--sh1)" : "none",
                transition: "all var(--fast)",
              }}
            >
              <Icon name={t.icon} size={13} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "0 32px 32px" }}>
        <div style={{ maxWidth: 680 }}>
          {tab === "profile" && (
            <div className="a-up">
              <SectionCard title="Profile Information" sub="Your name and contact details">
                <div style={{ padding: "16px 0", borderBottom: "1px solid var(--bord2)", display: "flex", alignItems: "center", gap: 16 }}>
                  <Avatar name={name || email || "U"} size={60} />
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "var(--t1)", marginBottom: 4 }}>Profile Photo</p>
                    <p style={{ fontSize: 12, color: "var(--t3)", marginBottom: 8 }}>Generated from your initials</p>
                    <Button variant="secondary" size="xs" disabled title="Coming soon">
                      Upload Photo
                    </Button>
                  </div>
                </div>
                <SettingRow
                  label="Full Name"
                  sub="Used for personalized greetings"
                  control={
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      style={inputStyle}
                    />
                  }
                />
                <SettingRow
                  label="Email Address"
                  sub="Your account email"
                  control={
                    <input value={email} readOnly style={{ ...inputStyle, color: "var(--t3)" }} />
                  }
                />
                <SettingRow
                  label="English Level"
                  sub="Affects suggestion complexity"
                  control={
                    <Segmented
                      value={level}
                      onChange={setLevel}
                      size="sm"
                      options={[
                        { value: "beginner", label: "Beginner" },
                        { value: "intermediate", label: "Intermediate" },
                        { value: "advanced", label: "Advanced" },
                      ]}
                    />
                  }
                />
                <SettingRow
                  label="Preferred Style"
                  sub="Default tone for corrections"
                  control={
                    <Segmented
                      value={style_}
                      onChange={setStyle_}
                      size="sm"
                      options={[
                        { value: "casual", label: "Casual" },
                        { value: "professional", label: "Professional" },
                        { value: "persuasive", label: "Persuasive" },
                      ]}
                    />
                  }
                />
              </SectionCard>

              <SectionCard title="Streak & Stats" sub="Your learning progress">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, padding: "12px 0 8px" }}>
                  {[
                    { label: "Day Streak", value: String(stats.streak), icon: "flame" as IconName, color: "var(--orange)" },
                    { label: "Total Words", value: stats.totalWords.toLocaleString(), icon: "trend-up" as IconName, color: "var(--green)" },
                    { label: "Accuracy", value: stats.accuracy === null ? "—" : `${stats.accuracy}%`, icon: "target" as IconName, color: "var(--blue)" },
                  ].map((s) => (
                    <div key={s.label} style={{ background: "var(--surf2)", borderRadius: "var(--r3)", padding: "14px", textAlign: "center" }}>
                      <Icon name={s.icon} size={20} color={s.color} style={{ marginBottom: 6 }} />
                      <p style={{ fontSize: 20, fontWeight: 800, color: "var(--t1)", letterSpacing: "-.5px" }}>{s.value}</p>
                      <p style={{ fontSize: 11, color: "var(--t3)", marginTop: 2 }}>{s.label}</p>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </div>
          )}

          {tab === "learning" && (
            <div className="a-up">
              <SectionCard title="AI Analysis Preferences" sub="Customize how AI analyzes your text">
                <SettingRow topBorder={false} label="Auto-analyze on paste" sub="Automatically analyze text when pasted into the editor" control={<Toggle value={prefs.autoAnalyze} onChange={(v) => setPref("autoAnalyze", v)} />} />
                <SettingRow label="Show grammar explanations" sub="Display detailed explanations for each correction" control={<Toggle value={prefs.showExplain} onChange={(v) => setPref("showExplain", v)} />} />
                <SettingRow label="Context-aware vocabulary" sub="Use technical vocabulary relevant to your field" control={<Toggle value={prefs.contextVocab} onChange={(v) => setPref("contextVocab", v)} />} />
                <SettingRow label="Save corrections to flashcards" sub="Auto-save vocabulary improvements to your deck" control={<Toggle value={prefs.saveToFlashcards} onChange={(v) => setPref("saveToFlashcards", v)} />} />
              </SectionCard>

              <SectionCard title="Vocabulary & Dictionary" sub="Words and phrases you've saved">
                <div style={{ padding: "14px 0 8px" }}>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    {vocabList.map((w) => (
                      <span
                        key={w}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          background: "var(--amber-ll)",
                          color: "var(--amber-dd)",
                          borderRadius: "var(--rmax)",
                          padding: "5px 12px",
                          fontSize: 12,
                          fontWeight: 600,
                          border: "1px solid var(--amber-l)",
                        }}
                      >
                        {w}
                        <button
                          onClick={() => handleRemoveWord(w)}
                          style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", color: "var(--amber-d)" }}
                        >
                          <Icon name="x" size={10} />
                        </button>
                      </span>
                    ))}
                    <input
                      value={newWord}
                      onChange={(e) => setNewWord(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddWord();
                      }}
                      placeholder="Add word…"
                      style={{ ...inputStyle, width: 140, padding: "5px 12px", borderRadius: "var(--rmax)" }}
                    />
                  </div>
                </div>
              </SectionCard>
            </div>
          )}

          {tab === "goals" && (
            <div className="a-up">
              <SectionCard title="Learning Goals" sub="What do you want to improve most?">
                <div style={{ padding: "12px 0 8px", display: "flex", flexDirection: "column", gap: 0 }}>
                  {GOALS.map((g, i) => (
                    <div
                      key={g}
                      onClick={() => toggleGoal(g)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "13px 0",
                        cursor: "pointer",
                        borderTop: i > 0 ? "1px solid var(--bord2)" : "none",
                      }}
                    >
                      <p style={{ fontSize: 14, fontWeight: goals.has(g) ? 600 : 400, color: goals.has(g) ? "var(--t1)" : "var(--t2)" }}>
                        {g}
                      </p>
                      <div
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: "var(--r1)",
                          flexShrink: 0,
                          border: `2px solid ${goals.has(g) ? "var(--amber)" : "var(--border)"}`,
                          background: goals.has(g) ? "var(--amber)" : "transparent",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all var(--fast)",
                        }}
                      >
                        {goals.has(g) && <Icon name="check" size={11} color="#fff" sw={3} />}
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>

              <SectionCard title="Weekly Word Goal" sub="How many new words do you want to improve each week?">
                <div style={{ padding: "16px 0 8px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <span style={{ fontSize: 13, color: "var(--t2)" }}>Target</span>
                    <span style={{ fontSize: 20, fontWeight: 800, color: "var(--amber-d)" }}>{weeklyGoal} words</span>
                  </div>
                  <input
                    type="range"
                    min={20}
                    max={300}
                    step={10}
                    value={weeklyGoal}
                    onChange={(e) => setWeeklyGoal(+e.target.value)}
                    style={{ width: "100%", accentColor: "var(--amber)", cursor: "pointer", height: 4 }}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--t4)", marginTop: 4 }}>
                    <span>20</span>
                    <span>300</span>
                  </div>
                </div>
              </SectionCard>
            </div>
          )}

          {tab === "account" && (
            <div className="a-up">
              <SectionCard title="Notifications" sub="Choose when to receive reminders">
                <SettingRow topBorder={false} label="Daily learning reminder" sub="Get a reminder to practice each day" control={<Toggle value={prefs.reminders} onChange={(v) => setPref("reminders", v)} />} />
                <SettingRow label="Weekly progress report" sub="Summary of your improvements every Monday" control={<Toggle value={prefs.weeklyReport} onChange={(v) => setPref("weeklyReport", v)} />} />
                <SettingRow label="New flashcard suggestions" sub="When new vocabulary is added from your corrections" control={<Toggle value={prefs.newCardSuggest} onChange={(v) => setPref("newCardSuggest", v)} />} />
                <SettingRow label="Achievement badges" sub="Celebrate streaks and milestones" control={<Toggle value={prefs.achievements} onChange={(v) => setPref("achievements", v)} />} />
              </SectionCard>

              <SectionCard title="Account" sub="Manage your account settings">
                <div style={{ padding: "12px 0 8px", display: "flex", flexDirection: "column", gap: 10 }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon="eye"
                    full
                    style={{ justifyContent: "flex-start", gap: 10 }}
                    onClick={handleChangePassword}
                  >
                    Change Password
                  </Button>
                  {pwMsg && (
                    <p style={{ fontSize: 12, color: "var(--t3)", margin: "-2px 0 2px 2px" }}>{pwMsg}</p>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    icon="download"
                    full
                    style={{ justifyContent: "flex-start", gap: 10 }}
                    onClick={handleExportData}
                  >
                    Export Learning Data
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon="logout"
                    full
                    style={{ justifyContent: "flex-start", gap: 10, color: "var(--red)" }}
                    onClick={() => signOut()}
                  >
                    Sign Out
                  </Button>
                </div>
              </SectionCard>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
