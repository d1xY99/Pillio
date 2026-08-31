import { getStore } from '@netlify/blobs';
import { sendPush, shouldAlert } from './_push.mjs';

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
  const incoming = Array.isArray(body.doses) ? body.doses : [];
  const sendTest = Boolean(body.test);

  const store = getStore('pillio-reminders');
  const existing = (await store.get(deviceId, { type: 'json' })) || {};
  const prevById = Object.fromEntries(
    (Array.isArray(existing.doses) ? existing.doses : [])
      .filter((dose) => dose?.id)
      .map((dose) => [dose.id, dose]),
  );

  const doses = incoming.map((dose) => ({
    ...dose,
    lastSent: prevById[dose.id]?.lastSent,
  }));

  let sent = 0;
  const now = Date.now();
  const canSend = Boolean(subscription?.endpoint || ntfyTopic);

  if (canSend && sendTest) {
    try {
      await sendPush(
        subscription,
        {
          title: 'Pillio',
          body: 'Reminders are on. You will get this if a dose is still open at its time.',
        },
        ntfyTopic,
      );
      sent += 1;
    } catch {
      // ignore
    }
  }

  const origin = new URL(request.url).origin;
  if (canSend) {
    for (const dose of doses) {
      if (!dose?.at) continue;
      if (shouldAlert(dose, now)) {
        try {
          await sendPush(subscription, dose, ntfyTopic);
          dose.lastSent = now;
          sent += 1;
        } catch {
          // ignore
        }
        continue;
      }
      const waitMs = dose.at - now;
      if (!dose.lastSent && waitMs > 15_000 && waitMs <= 14 * 60 * 1000) {
        fetch(`${origin}/.netlify/functions/wait-send-background`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ waitMs, subscription, ntfyTopic, dose, deviceId }),
        }).catch(() => {});
      }
    }
  }

  await store.setJSON(deviceId, {
    subscription,
    ntfyTopic,
    doses,
    updatedAt: Date.now(),
  });

  return Response.json({ ok: true, sent });
};
