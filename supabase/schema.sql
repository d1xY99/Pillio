-- Run this in the Supabase SQL editor (once).

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

create table if not exists public.supplements (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  type text not null,
  form text not null,
  default_amount double precision not null,
  default_unit text not null,
  color text not null,
  notes text,
  archived boolean not null default false,
  created_at bigint not null
);

create table if not exists public.schedules (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  supplement_id uuid not null references public.supplements (id) on delete cascade,
  time_minutes integer not null,
  frequency text not null,
  interval_days integer,
  weekdays_mask integer,
  cycle_on_days integer,
  cycle_off_days integer,
  reminder_enabled boolean not null default true,
  start_date bigint not null,
  end_date bigint,
  active boolean not null default true
);

create table if not exists public.dose_logs (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  supplement_id uuid not null references public.supplements (id) on delete cascade,
  schedule_id uuid,
  scheduled_for bigint not null,
  taken_at bigint,
  skipped boolean not null default false,
  amount double precision not null,
  unit text not null,
  notes text
);

create table if not exists public.exercises (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  muscle_group text not null,
  archived boolean not null default false,
  is_preset boolean not null default false
);

create table if not exists public.workout_sessions (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  started_at bigint not null,
  finished_at bigint,
  notes text
);

create table if not exists public.workout_sets (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  session_id uuid not null references public.workout_sessions (id) on delete cascade,
  exercise_id text not null,
  set_index integer not null,
  reps integer not null,
  weight_kg double precision not null,
  completed boolean not null default true
);

create table if not exists public.body_weights (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  logged_at bigint not null,
  weight_kg double precision not null,
  notes text
);

create table if not exists public.progress_photos (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  taken_at bigint not null,
  local_uri text not null,
  pose text not null,
  notes text
);

create index if not exists supplements_user_idx on public.supplements (user_id);
create index if not exists schedules_user_idx on public.schedules (user_id);
create index if not exists dose_logs_user_idx on public.dose_logs (user_id);
create index if not exists exercises_user_idx on public.exercises (user_id);
create index if not exists workout_sessions_user_idx on public.workout_sessions (user_id);
create index if not exists workout_sets_user_idx on public.workout_sets (user_id);
create index if not exists body_weights_user_idx on public.body_weights (user_id);
create index if not exists progress_photos_user_idx on public.progress_photos (user_id);

alter table public.profiles enable row level security;
alter table public.supplements enable row level security;
alter table public.schedules enable row level security;
alter table public.dose_logs enable row level security;
alter table public.exercises enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.workout_sets enable row level security;
alter table public.body_weights enable row level security;
alter table public.progress_photos enable row level security;

create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "own supplements" on public.supplements
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own schedules" on public.schedules
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own dose_logs" on public.dose_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own exercises" on public.exercises
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own workout_sessions" on public.workout_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own workout_sets" on public.workout_sets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own body_weights" on public.body_weights
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own progress_photos" on public.progress_photos
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

insert into storage.buckets (id, name, public)
values ('progress-photos', 'progress-photos', true)
on conflict (id) do nothing;

create policy "photo upload own folder"
  on storage.objects for insert
  with check (bucket_id = 'progress-photos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "photo read public"
  on storage.objects for select
  using (bucket_id = 'progress-photos');

create policy "photo update own folder"
  on storage.objects for update
  using (bucket_id = 'progress-photos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "photo delete own folder"
  on storage.objects for delete
  using (bucket_id = 'progress-photos' and auth.uid()::text = (storage.foldername(name))[1]);
