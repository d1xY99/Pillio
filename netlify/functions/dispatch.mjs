import { getStore } from '@netlify/blobs';
import { sendPush } from './_push.mjs';

const CRON_SECRET = process.env.PILLIO_CRON_SECRET || 'pillio-dispatch-2026';

export const config = {
  schedule: '* * * * *',
};

function isAllowed(request) {
  const auth = request.headers.get('authorization') || '';
  if (auth === `Bearer ${CRON_SECRET}`) return true;
  const origin = request.headers.get('origin') || '';
  if (origin.includes('pillioo.netlify.app') || origin.includes('localhost')) return true;
  if (!origin) return true;
  return false;
}

export default async (request) => {
  if (!isAllowed(request)) {
    return new Response('Unauthorized', { status: 401 });
  }

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
      if (dose.sent) {
        next.push(dose);
        continue;
      }
      if (dose.at > now) {
        next.push(dose);
        continue;
      }

      try {
        await sendPush(record.subscription, dose, record.ntfyTopic);
        sent += 1;
        next.push({ ...dose, sent: true });
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

  return Response.json({ ok: true, sent, devices });
};
