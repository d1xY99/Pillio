import { Hono } from 'hono';

import { db, requireUser, type AuthEnv } from '../lib/auth';
import * as map from '../lib/map';

export const bodyRoutes = new Hono<AuthEnv>();
bodyRoutes.use('*', requireUser);

bodyRoutes.get('/', async (c) => {
  const userId = c.get('userId');
  const client = db(c);
  const [wRes, pRes] = await Promise.all([
    client.from('body_weights').select('*').eq('user_id', userId).order('logged_at', { ascending: false }).limit(90),
    client.from('progress_photos').select('*').eq('user_id', userId).order('taken_at', { ascending: false }),
  ]);
  map.throwIf(wRes.error);
  map.throwIf(pRes.error);
  const weights = (wRes.data ?? []).map(map.weight);
  const photos = (pRes.data ?? []).map(map.photo);
  return c.json({ weights, photos, latest: weights[0] ?? null });
});

bodyRoutes.post('/weights', async (c) => {
  const body = await c.req.json<{ id?: string; weightKg: number; loggedAt?: number; notes?: string | null }>();
  const id = body.id || crypto.randomUUID();
  const { data, error } = await db(c)
    .from('body_weights')
    .insert({
      id,
      user_id: c.get('userId'),
      weight_kg: Number(body.weightKg),
      logged_at: body.loggedAt ?? Date.now(),
      notes: body.notes ?? null,
    })
    .select('*')
    .single();
  if (error || !data) return c.json({ error: error?.message ?? 'Could not save' }, 400);
  return c.json({ weight: map.weight(data) }, 201);
});

bodyRoutes.delete('/weights/:id', async (c) => {
  const { error } = await db(c)
    .from('body_weights')
    .delete()
    .eq('id', c.req.param('id'))
    .eq('user_id', c.get('userId'));
  if (error) return c.json({ error: error.message }, 400);
  return c.json({ ok: true });
});

bodyRoutes.post('/photos', async (c) => {
  const body = await c.req.json<{ id?: string; localUri: string; pose: string; takenAt?: number; notes?: string | null }>();
  const id = body.id || crypto.randomUUID();
  const { data, error } = await db(c)
    .from('progress_photos')
    .insert({
      id,
      user_id: c.get('userId'),
      local_uri: body.localUri,
      pose: body.pose,
      taken_at: body.takenAt ?? Date.now(),
      notes: body.notes ?? null,
    })
    .select('*')
    .single();
  if (error || !data) return c.json({ error: error?.message ?? 'Could not save' }, 400);
  return c.json({ photo: map.photo(data) }, 201);
});

bodyRoutes.delete('/photos/:id', async (c) => {
  const { error } = await db(c)
    .from('progress_photos')
    .delete()
    .eq('id', c.req.param('id'))
    .eq('user_id', c.get('userId'));
  if (error) return c.json({ error: error.message }, 400);
  return c.json({ ok: true });
});
