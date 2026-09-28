import { Hono } from 'hono';

import { db, requireUser, type AuthEnv } from '../lib/auth';

export const notesRoutes = new Hono<AuthEnv>();
notesRoutes.use('*', requireUser);

function note(row: any) {
  return {
    id: row.id,
    title: row.title,
    body: row.body ?? '',
    category: row.category,
    color: row.color,
    pinned: Boolean(row.pinned),
    archived: Boolean(row.archived),
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at ?? row.created_at),
  };
}

notesRoutes.get('/', async (c) => {
  const { data, error } = await db(c)
    .from('notes')
    .select('*')
    .eq('user_id', c.get('userId'))
    .order('updated_at', { ascending: false });
  if (error) return c.json({ error: error.message }, 400);
  return c.json({ notes: (data ?? []).map(note) });
});

notesRoutes.post('/', async (c) => {
  const body = await c.req.json<any>();
  const id = body.id || crypto.randomUUID();
  const now = Date.now();
  const { error } = await db(c).from('notes').insert({
    id,
    user_id: c.get('userId'),
    title: String(body.title ?? '').trim() || 'Untitled',
    body: String(body.body ?? ''),
    category: body.category || 'general',
    color: body.color || '#3EE0B7',
    pinned: Boolean(body.pinned),
    archived: false,
    created_at: Number(body.createdAt ?? now),
    updated_at: Number(body.updatedAt ?? now),
  });
  if (error) return c.json({ error: error.message }, 400);
  return c.json({ ok: true, id }, 201);
});

notesRoutes.patch('/:id', async (c) => {
  const body = await c.req.json<any>();
  const patch: Record<string, unknown> = { updated_at: Date.now() };
  if (body.title !== undefined) patch.title = String(body.title).trim() || 'Untitled';
  if (body.body !== undefined) patch.body = String(body.body);
  if (body.category !== undefined) patch.category = body.category;
  if (body.color !== undefined) patch.color = body.color;
  if (body.pinned !== undefined) patch.pinned = Boolean(body.pinned);
  if (body.archived !== undefined) patch.archived = Boolean(body.archived);
  const { error } = await db(c)
    .from('notes')
    .update(patch)
    .eq('id', c.req.param('id'))
    .eq('user_id', c.get('userId'));
  if (error) return c.json({ error: error.message }, 400);
  return c.json({ ok: true });
});

notesRoutes.delete('/:id', async (c) => {
  const { error } = await db(c)
    .from('notes')
    .delete()
    .eq('id', c.req.param('id'))
    .eq('user_id', c.get('userId'));
  if (error) return c.json({ error: error.message }, 400);
  return c.json({ ok: true });
});
