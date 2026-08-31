# Pillio API

TypeScript backend (Hono). The PWA talks only to these routes — not to Supabase tables.

## Run locally

```bash
npm run api
```

Listens on `http://localhost:8787/api`.

Put this in `.env`:

```
EXPO_PUBLIC_API_URL=http://localhost:8787
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
```

Then `npx expo start --web` in another terminal.

## Routes

| Method | Path | Page |
|---|---|---|
| POST | `/api/auth/sign-up` | Account |
| POST | `/api/auth/sign-in` | Account |
| POST | `/api/auth/refresh` | Session |
| POST | `/api/auth/sign-out` | Settings |
| GET | `/api/auth/me` | Boot |
| GET | `/api/today` | Today |
| POST | `/api/today/doses/:id/take` | Today check-off |
| POST | `/api/today/doses/:id/undo` | Today undo |
| GET | `/api/stack` | Stack |
| GET | `/api/stack/:id` | Item detail |
| POST | `/api/stack` | Add item |
| PATCH | `/api/stack/:id` | Edit item |
| POST | `/api/stack/:id/archive` | Archive |
| DELETE | `/api/stack/:id` | Delete |
| GET | `/api/train` | Train |
| POST | `/api/train/sessions` | Start workout |
| GET | `/api/train/sessions/:id` | Workout |
| POST | `/api/train/sessions/:id/sets` | Log set |
| POST | `/api/train/sessions/:id/finish` | Finish |
| GET | `/api/body` | Body |
| POST | `/api/body/weights` | Log kg |
| POST | `/api/body/photos` | Photo metadata |

`GET /today` generates upcoming dose rows, then returns one payload (supplements + schedules + doses). Train and Body are not fetched until those tabs open.

Production: Netlify rewrite `/api/*` → `/.netlify/functions/api`.
