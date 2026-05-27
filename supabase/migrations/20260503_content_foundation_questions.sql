create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  external_key text not null unique,
  prompt text not null,
  options jsonb not null,
  correct_answer_index integer not null check (correct_answer_index between 0 and 3),
  category text not null,
  difficulty_band text not null check (difficulty_band in ('easy', 'medium', 'hard')),
  pressure_tag text not null check (pressure_tag in ('calm', 'neutral', 'spiky')),
  is_active boolean not null default true,
  question_set_version text not null,
  source_label text not null default 'manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint questions_options_is_array check (jsonb_typeof(options) = 'array'),
  constraint questions_options_has_four_answers check (jsonb_array_length(options) = 4)
);

create index if not exists questions_active_version_idx
  on public.questions (is_active, question_set_version);

create index if not exists questions_active_category_idx
  on public.questions (is_active, category);

drop trigger if exists set_questions_updated_at on public.questions;
create trigger set_questions_updated_at
before update on public.questions
for each row
execute function public.set_updated_at();

alter table public.questions enable row level security;

drop policy if exists "questions_select_active_anon" on public.questions;
create policy "questions_select_active_anon"
on public.questions
for select
to anon
using (is_active = true);

drop policy if exists "questions_select_active_authenticated" on public.questions;
create policy "questions_select_active_authenticated"
on public.questions
for select
to authenticated
using (is_active = true);
