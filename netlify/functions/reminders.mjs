import { getStore } from '@netlify/blobs';

export default async (request) => {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const body = await request.json();
  const deviceId = String(body?.deviceId || '');
  if (!deviceId) {
    return Response.json({ ok: false, error: 'deviceId required' }, { status: 400 });
  }

  const store = getStore('pillio-reminders');
  await store.setJSON(deviceId, {
    subscription: body.subscription ?? null,
    doses: Array.isArray(body.doses) ? body.doses : [],
    updatedAt: Date.now(),
  });

  return Response.json({ ok: true });
};
