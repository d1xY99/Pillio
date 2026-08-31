import { getStore } from '@netlify/blobs';
import webpush from 'web-push';

const VAPID_PUBLIC =
  'BDIeR0nsom-ayGildXnmR7ySYlTDNXwh-BJcxCAmKQ1B_txQoY4YI1_vsWcO5qEGy1fIqGGa5iFMzmi98dUqAbM';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || 'lUKbFuBjIHOhlNLaYezsA59f5vRTNbMMvRQrJKWvDuI';

webpush.setVapidDetails('mailto:pillio@local', VAPID_PUBLIC, VAPID_PRIVATE);

export default async (request) => {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const body = await request.json();
  const deviceId = String(body?.deviceId || '');
  if (!deviceId) {
    return Response.json({ ok: false, error: 'deviceId required' }, { status: 400 });
  }

  const subscription = body.subscription ?? null;
  const doses = Array.isArray(body.doses) ? body.doses : [];
  const sendTest = Boolean(body.test);

  const store = getStore('pillio-reminders');
  await store.setJSON(deviceId, {
    subscription,
    doses,
    updatedAt: Date.now(),
  });

  let sent = 0;
  if (subscription?.endpoint) {
    const now = Date.now();
    const due = sendTest
      ? [
          {
            title: 'Pillio',
            body: 'Reminders are on. You will get this if a dose is still open at its time.',
          },
        ]
      : doses.filter((dose) => dose?.at && dose.at <= now + 20_000);

    for (const dose of due) {
      try {
        await webpush.sendNotification(
          subscription,
          JSON.stringify({
            title: dose.title || 'Pillio',
            body: dose.body || 'A dose is still unchecked.',
            doseId: dose.id,
          }),
        );
        sent += 1;
      } catch {
        // expired subscription
      }
    }
  }

  return Response.json({ ok: true, sent });
};
