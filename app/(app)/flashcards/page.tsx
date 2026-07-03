import { getSessionUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { computeStreak, hasActivityToday } from "@/lib/streak";
import { SignInPrompt } from "@/components/SignInPrompt";
import {
  FlashcardsScreen,
  type Flashcard,
} from "@/components/screens/FlashcardsScreen";
import { toggleLearned } from "./actions";

export default async function FlashcardsPage() {
  const session = await getSessionUser();
  if (!session) return <SignInPrompt feature="Flashcards" />;

  let cards: Flashcard[] = [];
  let reviewDates: string[] = [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("flashcards")
      .select("*")
      .eq("user_id", session.id)
      .order("created_at", { ascending: false });
    cards = (data ?? []) as Flashcard[];
    // A card was actually reviewed (not just created) when updated_at moved
    // past created_at — toggleLearned() is the only thing that bumps it.
    reviewDates = cards
      .filter((c) => new Date(c.updated_at).getTime() > new Date(c.created_at).getTime())
      .map((c) => c.updated_at);
  } catch {
    cards = [];
  }

  return (
    <FlashcardsScreen
      cards={cards}
      toggleLearned={toggleLearned}
      streak={computeStreak(reviewDates)}
      studiedToday={hasActivityToday(reviewDates)}
    />
  );
}
