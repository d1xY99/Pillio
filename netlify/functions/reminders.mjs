import { getStore } from '@netlify/blobs';
import { sendPush } from './_push.mjs';

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
  const ntfyTopic = typeof body.ntfyTopic === 'string' ? body.ntfyTopic : null;
  const doses = Array.isArray(body.doses) ? body.doses : [];
  const sendTest = Boolean(body.test);

  const store = getStore('pillio-reminders');
  await store.setJSON(deviceId, {
    subscription,
    ntfyTopic,
    doses,
    updatedAt: Date.now(),
  });

  let sent = 0;
  const canSend = Boolean(subscription?.endpoint || ntfyTopic);
  if (canSend) {
    const now = Date.now();
    if (sendTest) {
      try {
        await sendPush(subscription, {
          title: 'Pillio',
          body: 'Reminders are on. You will get this if a dose is still open at its time.',
        }, ntfyTopic);
        sent += 1;
      } catch {
        // ignore
      }
    }

    const origin = new URL(request.url).origin;
    for (const dose of doses) {
      if (!dose?.at) continue;
      const waitMs = dose.at - now;
      if (waitMs <= 15_000) {
        try {
          await sendPush(subscription, dose, ntfyTopic);
          sent += 1;
        } catch {
          // ignore
        }
        continue;
      }
      if (waitMs <= 14 * 60 * 1000) {
        fetch(`${origin}/.netlify/functions/wait-send-background`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ waitMs, subscription, ntfyTopic, dose }),
        }).catch(() => {});
      }
    }
  }

  return Response.json({ ok: true, sent });
};
