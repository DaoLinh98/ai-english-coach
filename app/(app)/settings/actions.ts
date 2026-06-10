"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("profiles").upsert(
    {
      user_id: user.id,
      ...patch,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
}

export async function addVocab(term: string) {
  const t = term.trim();
  if (!t) return;
  const { supabase, user } = await requireUser();
  await supabase
    .from("preferred_vocabulary")
    .upsert({ user_id: user.id, term: t }, { onConflict: "user_id,term" });
  revalidatePath("/settings");
}

export async function removeVocab(term: string) {
  const { supabase, user } = await requireUser();
  await supabase
    .from("preferred_vocabulary")
    .delete()
    .eq("user_id", user.id)
    .eq("term", term);
  revalidatePath("/settings");
}
