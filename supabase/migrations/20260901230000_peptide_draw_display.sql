alter table public.supplements
  add column if not exists draw_display text not null default 'units';
