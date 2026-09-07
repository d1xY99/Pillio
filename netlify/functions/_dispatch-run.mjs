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
    const due = doses.filter((dose) => shouldAlert(dose, now));
    if (due.length === 0) continue;

    const sentIds = new Set();
    const results = await Promise.allSettled(
      due.map(async (dose) => {
        await sendPush(record.subscription, dose, record.ntfyTopic);
        sentIds.add(dose.id);
      }),
    );
    for (const result of results) {
      if (result.status === 'fulfilled') sent += 1;
    }

    const next = doses.map((dose) => (sentIds.has(dose.id) ? { ...dose, lastSent: now } : dose));
    await store.setJSON(blob.key, {
      ...record,
      doses: next,
      updatedAt: Date.now(),
    });
  }

  return { sent, devices };
}
