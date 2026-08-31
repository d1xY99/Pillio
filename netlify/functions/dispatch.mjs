import { getStore } from '@netlify/blobs';
import webpush from 'web-push';

const VAPID_PUBLIC =
  'BDIeR0nsom-ayGildXnmR7ySYlTDNXwh-BJcxCAmKQ1B_txQoY4YI1_vsWcO5qEGy1fIqGGa5iFMzmi98dUqAbM';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || 'lUKbFuBjIHOhlNLaYezsA59f5vRTNbMMvRQrJKWvDuI';
const CRON_SECRET = process.env.PILLIO_CRON_SECRET || 'pillio-dispatch-2026';

webpush.setVapidDetails('mailto:pillio@local', VAPID_PUBLIC, VAPID_PRIVATE);

export default async (request) => {
  const auth = request.headers.get('authorization') || '';
  if (auth !== `Bearer ${CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const store = getStore('pillio-reminders');
  const listed = await store.list();
  const now = Date.now();
  let sent = 0;

  for (const blob of listed.blobs ?? []) {
    const record = await store.get(blob.key, { type: 'json' });
    if (!record?.subscription?.endpoint) continue;

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
        await webpush.sendNotification(
          record.subscription,
          JSON.stringify({
            title: dose.title || 'Pillio',
            body: dose.body || 'A dose is still unchecked.',
            doseId: dose.id,
          }),
        );
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

  return Response.json({ ok: true, sent });
};
