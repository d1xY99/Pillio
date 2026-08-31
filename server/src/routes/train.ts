import { Hono } from 'hono';

import { db, requireUser, type AuthEnv } from '../lib/auth';
import * as map from '../lib/map';

export const trainRoutes = new Hono<AuthEnv>();
trainRoutes.use('*', requireUser);

trainRoutes.get('/', async (c) => {
  const userId = c.get('userId');
  const client = db(c);
  const [exRes, seRes, setRes] = await Promise.all([
    client.from('exercises').select('*').eq('user_id', userId),
    client.from('workout_sessions').select('*').eq('user_id', userId).order('started_at', { ascending: false }).limit(40),
    client.from('workout_sets').select('*').eq('user_id', userId),
  ]);
  map.throwIf(exRes.error);
  map.throwIf(seRes.error);
  map.throwIf(setRes.error);

  const exercises = (exRes.data ?? []).map(map.exercise);
  const sessions = (seRes.data ?? []).map(map.session);
  const sets = (setRes.data ?? []).map(map.setRow);
  const open = sessions.find((row) => row.finishedAt == null) ?? null;

  const lifts = exercises
    .map((exercise) => ({
      exercise,
      weight: workingWeight(exercise.id, sessions, sets),
    }))
    .filter((row) => row.weight !== null)
    .sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0));

  return c.json({ exercises, sessions, sets, open, lifts });
});

trainRoutes.post('/sessions', async (c) => {
  const userId = c.get('userId');
  const client = db(c);
  const body = (await c.req.json<{ id?: string; startedAt?: number }>().catch(() => ({}))) as {
    id?: string;
    startedAt?: number;
  };
  const open = await client
    .from('workout_sessions')
    .select('*')
    .eq('user_id', userId)
    .is('finished_at', null)
    .order('started_at', { ascending: false })
    .maybeSingle();
  if (open.data) return c.json({ session: map.session(open.data) });
  const id = body.id || crypto.randomUUID();
  const { data, error } = await client
    .from('workout_sessions')
    .insert({ id, user_id: userId, started_at: body.startedAt ?? Date.now(), finished_at: null, notes: null })
    .select('*')
    .single();
  if (error || !data) return c.json({ error: error?.message ?? 'Could not start' }, 400);
  return c.json({ session: map.session(data) }, 201);
});

trainRoutes.get('/sessions/:id', async (c) => {
  const userId = c.get('userId');
  const client = db(c);
  const id = c.req.param('id');
  const [seRes, setRes] = await Promise.all([
    client.from('workout_sessions').select('*').eq('id', id).eq('user_id', userId).maybeSingle(),
    client.from('workout_sets').select('*').eq('session_id', id).eq('user_id', userId).order('set_index'),
  ]);
  if (!seRes.data) return c.json({ error: 'Session not found' }, 404);
  return c.json({ session: map.session(seRes.data), sets: (setRes.data ?? []).map(map.setRow) });
});

trainRoutes.post('/sessions/:id/finish', async (c) => {
  const body = (await c.req.json<{ notes?: string | null }>().catch(() => ({}))) as { notes?: string | null };
  const { data, error } = await db(c)
    .from('workout_sessions')
    .update({ finished_at: Date.now(), notes: body.notes ?? null })
    .eq('id', c.req.param('id'))
    .eq('user_id', c.get('userId'))
    .select('*')
    .single();
  if (error || !data) return c.json({ error: error?.message ?? 'Session not found' }, 404);
  return c.json({ session: map.session(data) });
});

trainRoutes.post('/sessions/:id/sets', async (c) => {
  const sessionId = c.req.param('id');
  const body = await c.req.json<{ id?: string; exerciseId: string; reps: number; weightKg: number }>();
  const userId = c.get('userId');
  const client = db(c);
  const existing = await client
    .from('workout_sets')
    .select('id')
    .eq('session_id', sessionId)
    .eq('exercise_id', body.exerciseId)
    .eq('user_id', userId);
  const id = body.id || crypto.randomUUID();
  const { data, error } = await client
    .from('workout_sets')
    .insert({
      id,
      user_id: userId,
      session_id: sessionId,
      exercise_id: body.exerciseId,
      set_index: (existing.data?.length ?? 0) + 1,
      reps: Number(body.reps),
      weight_kg: Number(body.weightKg),
      completed: true,
    })
    .select('*')
    .single();
  if (error || !data) return c.json({ error: error?.message ?? 'Could not add set' }, 400);
  return c.json({ set: map.setRow(data) }, 201);
});

trainRoutes.patch('/sets/:id', async (c) => {
  const body = await c.req.json<{ reps?: number; weightKg?: number; completed?: boolean }>();
  const patch: Record<string, unknown> = {};
  if (body.reps !== undefined) patch.reps = body.reps;
  if (body.weightKg !== undefined) patch.weight_kg = body.weightKg;
  if (body.completed !== undefined) patch.completed = body.completed;
  const { data, error } = await db(c)
    .from('workout_sets')
    .update(patch)
    .eq('id', c.req.param('id'))
    .eq('user_id', c.get('userId'))
    .select('*')
    .single();
  if (error || !data) return c.json({ error: error?.message ?? 'Set not found' }, 404);
  return c.json({ set: map.setRow(data) });
});

trainRoutes.delete('/sets/:id', async (c) => {
  const { error } = await db(c)
    .from('workout_sets')
    .delete()
    .eq('id', c.req.param('id'))
    .eq('user_id', c.get('userId'));
  if (error) return c.json({ error: error.message }, 400);
  return c.json({ ok: true });
});

trainRoutes.post('/exercises', async (c) => {
  const body = await c.req.json<{ id?: string; name: string; muscleGroup: string }>();
  const id = body.id || crypto.randomUUID();
  const { data, error } = await db(c)
    .from('exercises')
    .insert({
      id,
      user_id: c.get('userId'),
      name: String(body.name ?? '').trim(),
      muscle_group: body.muscleGroup,
      archived: false,
      is_preset: false,
    })
    .select('*')
    .single();
  if (error || !data) return c.json({ error: error?.message ?? 'Could not create' }, 400);
  return c.json({ exercise: map.exercise(data) }, 201);
});

function workingWeight(exerciseId: string, sessions: map.WorkoutSession[], sets: map.WorkoutSet[]) {
  const finished = new Set(sessions.filter((row) => row.finishedAt != null).map((row) => row.id));
  const done = sets.filter((row) => row.exerciseId === exerciseId && row.completed && finished.has(row.sessionId));
  if (!done.length) return null;
  const bySession = new Map<string, map.WorkoutSet[]>();
  for (const row of done) {
    const list = bySession.get(row.sessionId) ?? [];
    list.push(row);
    bySession.set(row.sessionId, list);
  }
  const latest = sessions.find((row) => bySession.has(row.id));
  if (!latest) return null;
  return Math.max(...(bySession.get(latest.id) ?? []).map((row) => row.weightKg));
}
