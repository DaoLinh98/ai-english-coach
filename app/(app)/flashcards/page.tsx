import { getSessionUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SignInPrompt } from "@/components/SignInPrompt";
import {
  FlashcardsScreen,
  type Flashcard,
} from "@/components/screens/FlashcardsScreen";
import { toggleLearned, importQueue } from "./actions";

export default async function FlashcardsPage() {
  const session = await getSessionUser();
  if (!session) return <SignInPrompt feature="Flashcards" />;

  let cards: Flashcard[] = [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("flashcards")
      .select("*")
      .eq("user_id", session.id)
      .order("created_at", { ascending: false });
    cards = (data ?? []) as Flashcard[];
  } catch {
    cards = [];
  }

  return (
    <FlashcardsScreen
      cards={cards}
      toggleLearned={toggleLearned}
      importQueue={importQueue}
    />
  );
}
