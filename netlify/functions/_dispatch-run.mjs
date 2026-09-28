import { getStore } from '@netlify/blobs';
import { sendPush, shouldAlert, shouldRefillAlert } from './_push.mjs';

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
    const refills = Array.isArray(record.refills) ? record.refills : [];
    const dueRefills = refills.filter((refill) => shouldRefillAlert(refill, now));
    if (due.length === 0 && dueRefills.length === 0) continue;

    const sentIds = new Set();
    const sentRefillIds = new Set();
    await Promise.allSettled([
      ...due.map(async (dose) => {
        await sendPush(record.subscription, dose, record.ntfyTopic);
        sentIds.add(dose.id);
      }),
      ...dueRefills.map(async (refill) => {
        await sendPush(record.subscription, refill, record.ntfyTopic);
        sentRefillIds.add(refill.id);
      }),
    ]);
    sent += sentIds.size + sentRefillIds.size;

    const nextDoses = doses.map((dose) => (sentIds.has(dose.id) ? { ...dose, lastSent: now } : dose));
    const nextRefills = refills.map((refill) =>
      sentRefillIds.has(refill.id) ? { ...refill, lastSent: now } : refill,
    );
    await store.setJSON(blob.key, {
      ...record,
      doses: nextDoses,
      refills: nextRefills,
      updatedAt: Date.now(),
    });
  }

  return { sent, devices };
}
