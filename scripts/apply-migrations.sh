#!/usr/bin/env bash
set -euo pipefail

if [ -z "${SUPABASE_DB_URL:-}" ]; then
  echo "Missing SUPABASE_DB_URL. Add it as a GitHub Actions secret (Database settings → URI, sslmode=require)."
  exit 1
fi

export PGCONNECT_TIMEOUT=20

psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 <<'SQL'
create table if not exists public.schema_migrations (
  id text primary key,
  applied_at timestamptz not null default now()
);
SQL

shopt -s nullglob
files=(supabase/migrations/*.sql)
if [ ${#files[@]} -eq 0 ]; then
  echo "No migration files."
  exit 0
fi

for file in "${files[@]}"; do
  id="$(basename "$file")"
  already="$(psql "$SUPABASE_DB_URL" -tAc "select 1 from public.schema_migrations where id = '${id}'")"
  if [ "$already" = "1" ]; then
    echo "skip $id"
    continue
  fi
  echo "apply $id"
  psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f "$file"
  psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -c "insert into public.schema_migrations (id) values ('${id}')"
done

echo "migrations up to date"
