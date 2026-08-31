# Pillio

Personal tracker for vitamins, peptides, supplements, and gym progress. English UI. Data stays on the device.

## Daily use (no laptop)

Open **https://pillioo.netlify.app** on iPhone Safari → Share → **Add to Home Screen**.

Use the Home Screen icon. Checking off a dose does **not** need a Mac.

For alerts: open the icon (not the Safari tab) → Settings → **Allow notifications**. Keep Reminder on for each supplement. A missed dose is pinged from the server about every 10 minutes after the due time.

## Scripts

```sh
npm run go          # Expo Go + tunnel (reminders)
npm start           # Expo Go, same Wi‑Fi
npm run typecheck
npm run export:web
```
