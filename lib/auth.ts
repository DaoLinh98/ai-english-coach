import { createClient } from "@/lib/supabase/server";

export type Profile = {
  user_id: string;
  name: string | null;
  level: string;
  preferred_style: string;
  learning_goals: string[];
  weekly_goal: number;
  prefs: Record<string, unknown>;
};

export type SessionUser = {
  id: string;
  email: string | null;
  profile: Profile | null;
};

/**
 * Returns the current user + profile, or null when signed out.
 * Tolerates a missing `profiles` table (pre-migration) by returning a null
 * profile rather than throwing, so anonymous-friendly routes keep working.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  let profile: Profile | null = null;
  try {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();
    profile = (data as Profile) ?? null;
  } catch {
    profile = null;
  }

  return { id: user.id, email: user.email ?? null, profile };
}
