# Supabase backup (this branch)

Cloud login is on `feature/supabase-auth` only. `main` is unchanged until you merge.

## 1. Create a project

1. Open https://supabase.com and create a free project.
2. Project Settings → API:
   - Project URL → `EXPO_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## 2. Tables

New SQL lives in `supabase/migrations/` and is applied by GitHub Actions on PR and on merge to `main`.

Add a repo secret **`SUPABASE_DB_URL`**:

1. Supabase → Project Settings → Database  
2. Connection string → **URI**  
3. Use the **direct** host (`db.<ref>.supabase.co:5432`) or Session pooler, not transaction pooler  
4. Append `?sslmode=require`  
5. GitHub → Settings → Secrets and variables → Actions → `SUPABASE_DB_URL`

The first schema (`schema.sql`) was applied by hand. Later changes (habits, etc.) go through CI.

In Authentication → Providers, keep Email enabled.  
For testing you can disable “Confirm email” in Authentication → Providers → Email.

## 3. Local / Netlify keys

Copy `.env.example` to `.env` and fill the two values.

For a **branch deploy** on Netlify (this branch, not `main`):

Site settings → Environment variables:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

Then deploy this branch. Expo inlines `EXPO_PUBLIC_*` at **build** time.

## 4. Test

1. Open the branch URL (or `npx expo start --web` with `.env`).
2. Settings → Sign in / Create account.
3. Add a vitamin, refresh, sign out/in — it should come back.
4. Only merge to `main` when that works.
