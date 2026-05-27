create extension if not exists pgcrypto;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  display_name text,
  best_score_rank integer not null default 0 check (best_score_rank >= 0),
  current_streak integer not null default 0 check (current_streak >= 0),
  last_played_at timestamptz,
  best_run_id uuid
);

create table if not exists public.runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  created_at timestamptz not null default now(),
  started_at timestamptz not null,
  completed_at timestamptz not null,
  outcome text not null check (outcome in ('eliminated', 'completed')),
  highest_rank integer not null check (highest_rank >= 0),
  correct_answers integer not null check (correct_answers >= 0),
  total_questions integer not null check (total_questions > 0),
  failure_reason text check (failure_reason in ('wrong-answer', 'timeout') or failure_reason is null),
  best_reserve_seconds integer check (best_reserve_seconds is null or best_reserve_seconds >= 0),
  question_set_version text not null
);

alter table public.profiles
  add constraint profiles_best_run_id_fkey
  foreign key (best_run_id)
  references public.runs(id)
  on delete set null;

create index if not exists runs_user_id_created_at_idx on public.runs (user_id, created_at desc);
create index if not exists runs_user_id_completed_at_idx on public.runs (user_id, completed_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.runs enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "runs_select_own" on public.runs;
create policy "runs_select_own"
on public.runs
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "runs_insert_own" on public.runs;
create policy "runs_insert_own"
on public.runs
for insert
to authenticated
with check (auth.uid() = user_id);
