alter table public.supplements add column if not exists track_inventory boolean not null default false;
alter table public.supplements add column if not exists quantity_on_hand double precision;
alter table public.supplements add column if not exists inventory_unit text;
alter table public.supplements add column if not exists low_stock_threshold double precision;
alter table public.supplements add column if not exists refill_reminder boolean not null default true;
