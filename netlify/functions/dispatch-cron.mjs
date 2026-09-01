import { runDispatch } from './_dispatch-run.mjs';

export const config = {
  schedule: '* * * * *',
};

export default async () => {
  const result = await runDispatch();
  return Response.json({ ok: true, ...result });
};
