import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
    const raw = await prisma.flashcard.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" },
      take: 300,
    });
    cards = raw.map((c) => ({
      id: c.id,
      word: c.word,
      pos: c.pos,
      level: c.level,
      context: c.context,
      tag: c.tag,
      def: c.def,
      example: c.example,
      synonyms: c.synonyms,
      learned: c.learned,
      phonetic: c.phonetic,
      dueDate: c.dueDate.toISOString().slice(0, 10),
      reviewCount: c.reviewCount,
      created_at: c.createdAt.toISOString(),
      updated_at: c.updatedAt.toISOString(),
    }));

    // Streak needs the full review history, not just the latest 300 cards,
    // so it's a separate lightweight (2-column) query rather than reusing `raw`.
    const history = await prisma.flashcard.findMany({
      where: { userId: session.id },
      select: { createdAt: true, updatedAt: true },
    });
    // A card was actually reviewed (not just created) when updated_at moved
    // past created_at — reviewFlashcard() is the only thing that bumps it.
    reviewDates = history
      .filter((c) => c.updatedAt.getTime() > c.createdAt.getTime())
      .map((c) => c.updatedAt.toISOString());
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
