create table if not exists public.habits (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  emoji text not null,
  color text not null,
  category text not null,
  notes text,
  frequency text not null,
  weekdays_mask integer,
  times_per_day integer not null default 1,
  archived boolean not null default false,
  created_at bigint not null
);

create table if not exists public.habit_logs (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  habit_id uuid not null references public.habits (id) on delete cascade,
  scheduled_for bigint not null,
  occurrence integer not null default 0,
  taken_at bigint,
  skipped boolean not null default false
);

create index if not exists habits_user_idx on public.habits (user_id);
create index if not exists habit_logs_user_idx on public.habit_logs (user_id);

alter table public.habits enable row level security;
alter table public.habit_logs enable row level security;

drop policy if exists "own habits" on public.habits;
create policy "own habits" on public.habits
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own habit_logs" on public.habit_logs;
create policy "own habit_logs" on public.habit_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
