import { getSessionUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SignInPrompt } from "@/components/SignInPrompt";
import {
  FlashcardsScreen,
  type Flashcard,
} from "@/components/screens/FlashcardsScreen";
import { reviewFlashcard } from "./actions";

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
    cards = ((data ?? []) as Array<Record<string, unknown>>).map((c) => ({
      ...c,
      dueDate: (c.due_date as string) ?? new Date().toLocaleDateString("en-CA"),
      reviewCount: (c.review_count as number) ?? 0,
    })) as Flashcard[];
  } catch {
    cards = [];
  }

  return (
    <FlashcardsScreen
      cards={cards}
      reviewFlashcard={reviewFlashcard}
    />
  );
}
