import { getSessionUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SettingsScreen } from "@/components/screens/SettingsScreen";
import { SignInPrompt } from "@/components/SignInPrompt";
import { updateProfile, addVocab, removeVocab } from "./actions";
import { signOut } from "@/app/(auth)/actions";

export default async function SettingsPage() {
  const session = await getSessionUser();
  if (!session) return <SignInPrompt feature="Settings" />;

  let vocab: string[] = [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("preferred_vocabulary")
      .select("term")
      .eq("user_id", session.id)
      .order("created_at", { ascending: true });
    vocab = (data ?? []).map((v: { term: string }) => v.term);
  } catch {
    vocab = [];
  }

  return (
    <SettingsScreen
      email={session.email ?? ""}
      profile={session.profile}
      vocab={vocab}
      updateProfile={updateProfile}
      addVocab={addVocab}
      removeVocab={removeVocab}
      signOut={signOut}
    />
  );
}
