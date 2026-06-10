-- AI English Coach — initial schema with Row Level Security.
-- Every user-owned table enforces `user_id = auth.uid()` (ADR 0002).

-- ── profiles ────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  user_id        uuid primary key references auth.users (id) on delete cascade,
  name           text,
  level          text not null default 'intermediate',
  preferred_style text not null default 'professional',
  learning_goals text[] not null default '{}',
  weekly_goal    integer not null default 100,
  prefs          jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ── preferred_vocabulary ────────────────────────────────────────────────────
create table if not exists public.preferred_vocabulary (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  term       text not null,
  created_at timestamptz not null default now(),
  unique (user_id, term)
);

-- ── correction_history + items ──────────────────────────────────────────────
create table if not exists public.correction_history (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  context     text not null,
  tone        text not null,
  level       text not null,
  input_text  text not null,
  output_text text not null,
  created_at  timestamptz not null default now()
);

create table if not exists public.correction_items (
  id         uuid primary key default gen_random_uuid(),
  history_id uuid not null references public.correction_history (id) on delete cascade,
  type       text not null,
  find       text not null,
  suggest    text not null,
  label      text not null,
  expl       text not null,
  rule       text not null
);
create index if not exists correction_items_history_idx
  on public.correction_items (history_id);

-- ── flashcards ──────────────────────────────────────────────────────────────
create table if not exists public.flashcards (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  word       text not null,
  pos        text,
  level      text not null default 'intermediate',
  context    text,
  def        text not null,
  example    text,
  synonyms   text[] not null default '{}',
  learned    boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists flashcards_user_idx on public.flashcards (user_id);

-- ── quizzes + attempts ──────────────────────────────────────────────────────
create table if not exists public.quizzes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  questions  jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.quiz_attempts (
  id         uuid primary key default gen_random_uuid(),
  quiz_id    uuid not null references public.quizzes (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  score      integer not null,
  total      integer not null,
  answers    jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists quiz_attempts_user_idx on public.quiz_attempts (user_id);

-- ── Row Level Security ──────────────────────────────────────────────────────
alter table public.profiles            enable row level security;
alter table public.preferred_vocabulary enable row level security;
alter table public.correction_history  enable row level security;
alter table public.correction_items    enable row level security;
alter table public.flashcards          enable row level security;
alter table public.quizzes             enable row level security;
alter table public.quiz_attempts       enable row level security;

-- Helper to (re)create an owner policy for a user_id table.
do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'preferred_vocabulary', 'correction_history',
    'flashcards', 'quizzes', 'quiz_attempts'
  ]
  loop
    execute format('drop policy if exists %I_owner on public.%I;', t, t);
    -- profiles keys on user_id (its PK); others on their user_id column.
    execute format(
      'create policy %I_owner on public.%I
         for all to authenticated
         using (user_id = auth.uid())
         with check (user_id = auth.uid());', t, t);
  end loop;
end$$;

-- correction_items has no user_id; authorize via its parent history row.
drop policy if exists correction_items_owner on public.correction_items;
create policy correction_items_owner on public.correction_items
  for all to authenticated
  using (
    exists (
      select 1 from public.correction_history h
      where h.id = correction_items.history_id and h.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.correction_history h
      where h.id = correction_items.history_id and h.user_id = auth.uid()
    )
  );

-- ── Auto-create a profile row when a user signs up ──────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (user_id, name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)))
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
