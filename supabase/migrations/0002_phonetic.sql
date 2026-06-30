-- Add phonetic IPA column to flashcards (nullable; existing rows stay NULL)
alter table public.flashcards
  add column if not exists phonetic text;
