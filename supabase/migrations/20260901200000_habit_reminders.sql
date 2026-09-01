alter table public.habits
  add column if not exists reminder_enabled boolean not null default true;

alter table public.habits
  add column if not exists reminder_minutes integer not null default 540;
