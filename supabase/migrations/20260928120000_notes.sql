create table if not exists public.notes (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  body text not null default '',
  category text not null,
  color text not null,
  pinned boolean not null default false,
  archived boolean not null default false,
  created_at bigint not null,
  updated_at bigint not null
);

create index if not exists notes_user_idx on public.notes (user_id);

alter table public.notes enable row level security;

drop policy if exists "own notes" on public.notes;
create policy "own notes" on public.notes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
