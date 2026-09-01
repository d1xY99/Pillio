import { runDispatch } from './_dispatch-run.mjs';

const CRON_SECRET = process.env.PILLIO_CRON_SECRET || 'pillio-dispatch-2026';

export default async (request) => {
  const auth = request.headers.get('authorization') || '';
  if (auth !== `Bearer ${CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const result = await runDispatch();
  return Response.json({ ok: true, ...result });
};
