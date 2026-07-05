-- Prevent duplicate flashcards for the same user at the database level.
-- App-side ilike checks are race-prone (two concurrent "+ Add" clicks can
-- both pass the check before either insert commits); a unique index makes
-- duplicate prevention atomic regardless of casing/whitespace.
create unique index if not exists flashcards_user_word_unique
  on public.flashcards (user_id, lower(trim(word)));
