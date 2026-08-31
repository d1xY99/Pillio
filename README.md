# Pillio

Personal tracker for vitamins, peptides, supplements, and gym progress. English UI. Data stays on the device or in the browser. No account.

## What it does

- **Today** — doses due today. Check them off.
- **Stack** — vitamins, peptides, and supplements with dose, schedule, history, and an adherence heatmap.
- **Train** — workouts, sets, last-time weights, and working weight per exercise.
- **Progress** — body weight chart and progress photos with side-by-side compare.

## Web on iPhone (Netlify, free)

Push to GitHub, then in [Netlify](https://app.netlify.com):

1. Add new site → Import an existing project → GitHub → `Pillio`.
2. Netlify reads `netlify.toml` (build: `npx expo export --platform web`, publish: `dist`).
3. After deploy, open the `.netlify.app` URL in **Safari**.
4. Share → **Add to Home Screen**.

You get a Pillio icon. This is a website in fullscreen, not an App Store app. iOS will **not** send a notification at 10:00. Overdue doses still show on Today.

## Real reminders (Expo Go, free)

1. Install [Expo Go](https://apps.apple.com/app/expo-go/id982107779).
2. From this repo:

```sh
npm install
npx expo start
```

3. Scan the QR code. Reminders, camera, and SQLite work on a physical iPhone.

## Stack

Expo SDK 57, Expo Router, TypeScript, SQLite (Drizzle), local notifications.

## Scripts

```sh
npm start
npm run typecheck
npm run export:web
```
