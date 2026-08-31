# Pillio

Personal tracker for vitamins, peptides, supplements, and gym progress. English UI. Data stays on the device.

## Real reminders: Expo Go (free)

This is the path where iPhone notifications work: alert at 10:00 **only if the dose is still unchecked**.

1. On the iPhone, install [Expo Go](https://apps.apple.com/app/expo-go/id982107779).
2. On the Mac, in this repo:

```sh
npm install
npm run go
```

3. Scan the QR with the Camera app (or inside Expo Go). Tunnel mode does not require the same Wi‑Fi.
4. In Pillio: **Allow notifications**. Then open a supplement, turn **Reminder** on, set the time.
5. Settings → **Send test alert in 8 seconds** to confirm iOS banners work. Lock the phone and wait.

If you deny once, enable them in iPhone **Settings → Notifications → Expo Go**.

The Mac must stay on while you use the app this way (Metro is serving it). Close the terminal and Expo Go cannot reload new code, but already-scheduled notifications can still fire.

## Web (Netlify)

https://pillioo.netlify.app is the Home Screen website. It has no iOS dose alerts. Use Expo Go for reminders.

## Scripts

```sh
npm run go          # Expo Go + tunnel (reminders)
npm start           # Expo Go, same Wi‑Fi
npm run typecheck
npm run export:web
```
