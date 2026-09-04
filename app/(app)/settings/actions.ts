"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, user };
}

export type ProfilePatch = {
  name?: string;
  level?: string;
  preferred_style?: string;
  learning_goals?: string[];
  weekly_goal?: number;
  prefs?: Record<string, unknown>;
};

export async function updateProfile(patch: ProfilePatch) {
  const { user } = await requireUser();
  await prisma.profile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      name: patch.name,
      level: patch.level,
      preferredStyle: patch.preferred_style,
      learningGoals: patch.learning_goals,
      weeklyGoal: patch.weekly_goal,
      prefs: patch.prefs as Prisma.InputJsonValue | undefined,
    },
    update: {
      name: patch.name,
      level: patch.level,
      preferredStyle: patch.preferred_style,
      learningGoals: patch.learning_goals,
      weeklyGoal: patch.weekly_goal,
      prefs: patch.prefs as Prisma.InputJsonValue | undefined,
      updatedAt: new Date(),
    },
  });
  revalidatePath("/settings");
}

export async function addVocab(term: string) {
  const t = term.trim();
  if (!t) return;
  const { user } = await requireUser();
  await prisma.preferredVocabulary.upsert({
    where: { userId_term: { userId: user.id, term: t } },
    create: { userId: user.id, term: t },
    update: {},
  });
  revalidatePath("/settings");
}

export async function removeVocab(term: string) {
  const { user } = await requireUser();
  await prisma.preferredVocabulary.deleteMany({
    where: { userId: user.id, term },
  });
  revalidatePath("/settings");
}

/** Send a Supabase password-reset email to the signed-in user's address. */
export async function requestPasswordReset() {
  const { supabase, user } = await requireUser();
  if (!user.email) throw new Error("No email address on this account");
  const { error } = await supabase.auth.resetPasswordForEmail(user.email);
  if (error) throw new Error(error.message);
}
