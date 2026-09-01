alter table public.supplements
  add column if not exists vial_mg double precision;

alter table public.supplements
  add column if not exists bac_ml double precision;
