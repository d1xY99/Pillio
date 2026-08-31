import { getStore } from '@netlify/blobs';
import { sendPush } from './_push.mjs';

export default async (request) => {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const body = await request.json();
  const waitMs = Math.max(0, Math.min(Number(body.waitMs) || 0, 14 * 60 * 1000));
  if (waitMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  if (!body.subscription?.endpoint && !body.ntfyTopic) {
    return Response.json({ ok: false }, { status: 400 });
  }

  try {
    await sendPush(body.subscription, body.dose || {}, body.ntfyTopic);
    if (body.deviceId && body.dose?.id) {
      const store = getStore('pillio-reminders');
      const record = (await store.get(body.deviceId, { type: 'json' })) || {};
      const doses = Array.isArray(record.doses) ? record.doses : [];
      await store.setJSON(body.deviceId, {
        ...record,
        doses: doses.map((dose) =>
          dose.id === body.dose.id ? { ...dose, lastSent: Date.now() } : dose,
        ),
        updatedAt: Date.now(),
      });
    }
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ ok: false, error: String(error?.message || error) }, { status: 500 });
  }
};
