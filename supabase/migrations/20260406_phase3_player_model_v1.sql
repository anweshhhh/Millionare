alter table public.runs
  add column if not exists avg_response_time_ms integer,
  add column if not exists avg_first_selection_time_ms integer,
  add column if not exists selection_change_rate numeric,
  add column if not exists pressure_miss_count integer not null default 0,
  add column if not exists timeout_count integer not null default 0,
  add column if not exists category_summary jsonb;

create table if not exists public.run_question_signals (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.runs(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  question_id text not null,
  question_rank integer not null check (question_rank > 0),
  category text not null,
  result text not null check (result in ('correct', 'incorrect', 'timeout')),
  correct_answer_index integer not null check (correct_answer_index between 0 and 3),
  selected_answer_index integer check (selected_answer_index between 0 and 3 or selected_answer_index is null),
  locked_answer_index integer check (locked_answer_index between 0 and 3 or locked_answer_index is null),
  response_time_ms integer not null check (response_time_ms >= 0),
  first_selection_time_ms integer check (first_selection_time_ms is null or first_selection_time_ms >= 0),
  selection_change_count integer not null default 0 check (selection_change_count >= 0),
  time_remaining_at_lock integer check (time_remaining_at_lock is null or time_remaining_at_lock >= 0),
  locked_with_under_5s boolean not null default false,
  timed_out_without_lock boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.player_models (
  user_id uuid primary key references public.profiles(user_id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  runs_observed integer not null default 0 check (runs_observed >= 0),
  questions_observed integer not null default 0 check (questions_observed >= 0),
  accuracy_rate numeric not null default 0 check (accuracy_rate >= 0 and accuracy_rate <= 1),
  timeout_rate numeric not null default 0 check (timeout_rate >= 0 and timeout_rate <= 1),
  avg_response_time_ms integer,
  avg_first_selection_time_ms integer,
  avg_selection_change_count numeric not null default 0 check (avg_selection_change_count >= 0),
  pressure_accuracy_rate numeric not null default 0 check (pressure_accuracy_rate >= 0 and pressure_accuracy_rate <= 1),
  pressure_timeout_rate numeric not null default 0 check (pressure_timeout_rate >= 0 and pressure_timeout_rate <= 1),
  confidence_style text not null default 'insufficient-data',
  hesitation_style text not null default 'insufficient-data',
  pressure_style text not null default 'insufficient-data',
  category_snapshot jsonb not null default '{}'::jsonb,
  model_version text not null default 'player-model-v1'
);

create index if not exists run_question_signals_user_id_created_at_idx
  on public.run_question_signals (user_id, created_at desc);
create index if not exists run_question_signals_run_id_idx
  on public.run_question_signals (run_id);
create index if not exists run_question_signals_user_id_category_idx
  on public.run_question_signals (user_id, category);

drop trigger if exists set_player_models_updated_at on public.player_models;
create trigger set_player_models_updated_at
before update on public.player_models
for each row
execute function public.set_updated_at();

alter table public.run_question_signals enable row level security;
alter table public.player_models enable row level security;

drop policy if exists "run_question_signals_select_own" on public.run_question_signals;
create policy "run_question_signals_select_own"
on public.run_question_signals
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "run_question_signals_insert_own" on public.run_question_signals;
create policy "run_question_signals_insert_own"
on public.run_question_signals
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "player_models_select_own" on public.player_models;
create policy "player_models_select_own"
on public.player_models
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "player_models_insert_own" on public.player_models;
create policy "player_models_insert_own"
on public.player_models
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "player_models_update_own" on public.player_models;
create policy "player_models_update_own"
on public.player_models
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
