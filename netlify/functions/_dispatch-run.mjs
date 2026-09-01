import { getStore } from '@netlify/blobs';
import { sendPush, shouldAlert } from './_push.mjs';

export async function runDispatch() {
  const store = getStore('pillio-reminders');
  const listed = await store.list();
  const now = Date.now();
  let sent = 0;
  let devices = 0;

  for (const blob of listed.blobs ?? []) {
    const record = await store.get(blob.key, { type: 'json' });
    if (!record?.subscription?.endpoint && !record?.ntfyTopic) continue;
    devices += 1;

    const doses = Array.isArray(record.doses) ? record.doses : [];
    let changed = false;
    const next = [];

    for (const dose of doses) {
      if (!dose?.id || !dose?.at) continue;
      if (!shouldAlert(dose, now)) {
        next.push(dose);
        continue;
      }

      try {
        await sendPush(record.subscription, dose, record.ntfyTopic);
        sent += 1;
        next.push({ ...dose, lastSent: now });
        changed = true;
      } catch (error) {
        const status = error?.statusCode;
        if (status === 404 || status === 410) {
          changed = true;
          continue;
        }
        next.push(dose);
      }
    }

    if (changed) {
      await store.setJSON(blob.key, {
        ...record,
        doses: next,
        updatedAt: Date.now(),
      });
    }
  }

  return { sent, devices };
}
