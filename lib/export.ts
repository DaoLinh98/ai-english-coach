// lib/export.ts — client-side file export helpers (Copy → Download).
// Builds Markdown documents for corrected text + explanations and for
// flashcard decks, then triggers a browser download. No server involved.

import type { LocatedCorrection } from "@/lib/corrections";

export type ExportableFlashcard = {
  word: string;
  pos: string;
  level: string;
  context: string;
  def: string;
  example: string;
  synonyms: string[];
  learned: boolean;
};

const TYPE_LABEL: Record<string, string> = {
  grammar: "Grammar",
  style: "Style",
  vocab: "Vocabulary",
};

/** Trigger a client-side download of `content` as `filename`. */
export function triggerDownload(
  filename: string,
  content: string,
  mime = "text/markdown;charset=utf-8",
): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function timestamp(): string {
  return new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
}

/**
 * Build a Markdown document containing the corrected text plus a numbered
 * list of every correction's explanation (label, rule, before → after).
 */
export function buildCorrectionMarkdown(
  correctedText: string,
  corrections: LocatedCorrection[],
): string {
  const lines: string[] = [];
  lines.push("# AI English Coach — Corrected Text", "");
  lines.push(correctedText.trim(), "");

  if (corrections.length) {
    lines.push("---", "", "## Explanations", "");
    corrections.forEach((c, i) => {
      lines.push(`### ${i + 1}. ${c.label} (${TYPE_LABEL[c.type] ?? c.type})`);
      lines.push(`- **Change:** \`${c.find}\` → \`${c.suggest}\``);
      if (c.rule) lines.push(`- **Rule:** ${c.rule}`);
      if (c.expl) lines.push(`- **Why:** ${c.expl}`);
      lines.push("");
    });
  }

  return lines.join("\n");
}

/** Build a Markdown deck of flashcards. */
export function buildFlashcardsMarkdown(cards: ExportableFlashcard[]): string {
  const lines: string[] = [];
  lines.push("# AI English Coach — Flashcards", "");
  lines.push(`_${cards.length} card${cards.length !== 1 ? "s" : ""} exported._`, "");

  cards.forEach((c) => {
    lines.push(`## ${c.word}${c.learned ? " ✓" : ""}`);
    lines.push(`- **Part of speech:** ${c.pos}`);
    lines.push(`- **Level:** ${c.level}`);
    lines.push(`- **Context:** ${c.context}`);
    lines.push(`- **Definition:** ${c.def}`);
    lines.push(`- **Example:** ${c.example}`);
    if (c.synonyms?.length) lines.push(`- **Synonyms:** ${c.synonyms.join(", ")}`);
    lines.push("");
  });

  return lines.join("\n");
}

export function exportCorrection(correctedText: string, corrections: LocatedCorrection[]): void {
  triggerDownload(`corrected-text-${timestamp()}.md`, buildCorrectionMarkdown(correctedText, corrections));
}

export function exportFlashcards(cards: ExportableFlashcard[]): void {
  triggerDownload(`flashcards-${timestamp()}.md`, buildFlashcardsMarkdown(cards));
}

export type LearningData = {
  email: string;
  name: string;
  level: string;
  preferredStyle: string;
  weeklyGoal: number;
  learningGoals: string[];
  vocabulary: string[];
  stats: { streak: number; totalWords: number; accuracy: number | null };
  prefs: Record<string, boolean>;
};

/** Build a Markdown summary of the user's profile, preferences and progress. */
export function buildLearningDataMarkdown(d: LearningData): string {
  const lines: string[] = [];
  lines.push("# AI English Coach — Learning Data Export", "");

  lines.push("## Profile");
  if (d.name) lines.push(`- **Name:** ${d.name}`);
  if (d.email) lines.push(`- **Email:** ${d.email}`);
  lines.push(`- **English level:** ${d.level}`);
  lines.push(`- **Preferred style:** ${d.preferredStyle}`);
  lines.push("");

  lines.push("## Progress");
  lines.push(`- **Day streak:** ${d.stats.streak}`);
  lines.push(`- **Total words improved:** ${d.stats.totalWords}`);
  lines.push(`- **Quiz accuracy:** ${d.stats.accuracy === null ? "—" : `${d.stats.accuracy}%`}`);
  lines.push("");

  lines.push("## Goals");
  lines.push(`- **Weekly word goal:** ${d.weeklyGoal}`);
  if (d.learningGoals.length) {
    lines.push("- **Learning goals:**");
    d.learningGoals.forEach((g) => lines.push(`  - ${g}`));
  }
  lines.push("");

  lines.push("## Preferences");
  Object.entries(d.prefs).forEach(([k, v]) => lines.push(`- **${k}:** ${v ? "on" : "off"}`));
  lines.push("");

  lines.push("## Saved Vocabulary");
  if (d.vocabulary.length) d.vocabulary.forEach((w) => lines.push(`- ${w}`));
  else lines.push("_No saved words yet._");

  return lines.join("\n");
}

export function exportLearningData(d: LearningData): void {
  triggerDownload(`learning-data-${timestamp()}.md`, buildLearningDataMarkdown(d));
}
