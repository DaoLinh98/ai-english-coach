-- Tag/category filter for flashcards (#72).
-- Additive only — nullable so existing rows are simply "Uncategorized" until
-- backfilled. New cards default `tag` to the AI-provided `pos` at creation
-- time when no explicit tag is supplied (handled in application code).

alter table public.flashcards
  add column if not exists tag text;

create index if not exists flashcards_tag_idx on public.flashcards (user_id, tag);
