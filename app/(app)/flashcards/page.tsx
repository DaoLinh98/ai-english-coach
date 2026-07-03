import { getSessionUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { computeStreak, hasActivityToday } from "@/lib/streak";
import { SignInPrompt } from "@/components/SignInPrompt";
import {
  FlashcardsScreen,
  type Flashcard,
} from "@/components/screens/FlashcardsScreen";
import { reviewFlashcard, updateFlashcardTag } from "./actions";

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
    const raw = (data ?? []) as Array<Record<string, unknown>>;
    cards = raw.map((c) => ({
      ...c,
      dueDate: (c.due_date as string) ?? new Date().toLocaleDateString("en-CA"),
      reviewCount: (c.review_count as number) ?? 0,
      tag: (c.tag as string | null) ?? null,
    })) as Flashcard[];
    // A card was actually reviewed (not just created) when updated_at moved
    // past created_at — reviewFlashcard() is the only thing that bumps it.
    reviewDates = raw
      .filter((c) => new Date(c.updated_at as string).getTime() > new Date(c.created_at as string).getTime())
      .map((c) => c.updated_at as string);
  } catch {
    cards = [];
  }

  return (
    <FlashcardsScreen
      cards={cards}
      reviewFlashcard={reviewFlashcard}
      updateFlashcardTag={updateFlashcardTag}
      streak={computeStreak(reviewDates)}
      studiedToday={hasActivityToday(reviewDates)}
    />
  );
}
