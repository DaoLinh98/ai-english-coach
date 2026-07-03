-- Spaced-repetition (SM-2) scheduling state for flashcards.
-- Additive only — existing rows default to "due now" so they surface
-- immediately in the first due-cards session.

alter table public.flashcards
  add column if not exists ease_factor   real not null default 2.5,
  add column if not exists interval_days integer not null default 0,
  add column if not exists review_count  integer not null default 0,
  add column if not exists due_date      date not null default current_date;

create index if not exists flashcards_due_idx on public.flashcards (user_id, due_date);
