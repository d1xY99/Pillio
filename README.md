# Pillio

Personal tracker for vitamins, peptides, supplements, and gym progress. English UI. Everything stays on the iPhone — no account and no server.

## What it does

- **Today** — doses due today. Check them off. A reminder at 10:00 fires only if that dose is still unchecked.
- **Stack** — vitamins, peptides, and supplements with dose, schedule, history, and an adherence heatmap.
- **Train** — workouts, sets, last-time weights, and working weight per exercise.
- **Progress** — body weight chart and progress photos with side-by-side compare.

## Run on iPhone

1. Install [Expo Go](https://apps.apple.com/app/expo-go/id982107779).
2. From this repo:

```sh
npm install
npx expo start
```

3. Scan the QR code with the Camera app (or Expo Go). The project opens in Expo Go.

Notifications, camera, and the photo library need a physical iPhone. Reminders use local notifications: if you mark a dose taken before the due time, that notification is cancelled.

## Stack

Expo SDK 57, Expo Router, TypeScript, SQLite (Drizzle), local notifications.

## Scripts

```sh
npm start
npm run typecheck
npm run ios
```
