import { Hono } from 'hono';

import { db, requireUser, type AuthEnv } from '../lib/auth';
import { addClientDays, eachClientDay, endOfClientDay, localWeekday, startOfClientDay } from '../lib/time';
import { tzFromQuery } from '../lib/tz';

export const habitsRoutes = new Hono<AuthEnv>();
habitsRoutes.use('*', requireUser);

type HabitRow = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  category: string;
  notes: string | null;
  frequency: string;
  weekdays_mask: number | null;
  times_per_day: number;
  reminder_enabled?: boolean;
  reminder_minutes?: number;
  archived: boolean;
  created_at: number;
};

function habit(row: any) {
  return {
    id: row.id,
    name: row.name,
    emoji: row.emoji,
    color: row.color,
    category: row.category,
    notes: row.notes ?? null,
    frequency: row.frequency,
    weekdaysMask: row.weekdays_mask ?? null,
    timesPerDay: Number(row.times_per_day ?? 1),
    reminderEnabled: row.reminder_enabled !== false,
    reminderMinutes: Number(row.reminder_minutes ?? 540),
    archived: Boolean(row.archived),
    createdAt: Number(row.created_at),
  };
}

function log(row: any) {
  return {
    id: row.id,
    habitId: row.habit_id,
    scheduledFor: Number(row.scheduled_for),
    occurrence: Number(row.occurrence ?? 0),
    takenAt: row.taken_at == null ? null : Number(row.taken_at),
    skipped: Boolean(row.skipped),
  };
}

function dueOnDay(row: HabitRow, dayStart: number, tz: number) {
  if (row.archived) return false;
  const day = localWeekday(dayStart, tz);
  if (row.frequency === 'daily') return true;
  if (row.frequency === 'weekdays') return day >= 1 && day <= 5;
  const mask = row.weekdays_mask ?? 0;
  return (mask & (1 << day)) !== 0;
}

habitsRoutes.get('/', async (c) => {
  const tz = tzFromQuery(c.req.query('tzOffset'));
  const now = Number(c.req.query('now')) || Date.now();
  const from = Number(c.req.query('from')) || startOfClientDay(now, tz);
  const to = Number(c.req.query('to')) || endOfClientDay(now, tz);
  const userId = c.get('userId');
  const client = db(c);

  const [hRes, lRes] = await Promise.all([
    client.from('habits').select('*').eq('user_id', userId),
    client.from('habit_logs').select('*').eq('user_id', userId),
  ]);
  if (hRes.error) return c.json({ error: hRes.error.message }, 400);
  if (lRes.error) return c.json({ error: lRes.error.message }, 400);

  const habits = (hRes.data ?? []) as HabitRow[];
  let logs = (lRes.data ?? []).map(log);

  const inserts: Record<string, unknown>[] = [];
  const have = new Set(logs.map((row) => `${row.habitId}:${row.scheduledFor}:${row.occurrence}`));
  for (const dayStart of eachClientDay(from, addClientDays(from, 1, tz), tz)) {
    for (const item of habits) {
      if (!dueOnDay(item, dayStart, tz)) continue;
      const times = Math.max(1, Number(item.times_per_day ?? 1));
      for (let occurrence = 0; occurrence < times; occurrence += 1) {
        const key = `${item.id}:${dayStart}:${occurrence}`;
        if (have.has(key)) continue;
        inserts.push({
          id: crypto.randomUUID(),
          user_id: userId,
          habit_id: item.id,
          scheduled_for: dayStart,
          occurrence,
          taken_at: null,
          skipped: false,
        });
      }
    }
  }
  if (inserts.length) {
    const { data, error } = await client.from('habit_logs').upsert(inserts).select('*');
    if (!error) logs = [...logs, ...(data ?? []).map(log)];
  }

  return c.json({
    habits: habits.map(habit),
    logs,
  });
});

habitsRoutes.post('/', async (c) => {
  const body = await c.req.json<any>();
  const id = body.id || crypto.randomUUID();
  const { error } = await db(c).from('habits').insert({
    id,
    user_id: c.get('userId'),
    name: String(body.name ?? '').trim(),
    emoji: body.emoji || '💧',
    color: body.color || '#3EE0B7',
    category: body.category || 'health',
    notes: body.notes ?? null,
    frequency: body.frequency || 'daily',
    weekdays_mask: body.weekdaysMask ?? null,
    times_per_day: Number(body.timesPerDay ?? 1),
    reminder_enabled: body.reminderEnabled !== false,
    reminder_minutes: Number(body.reminderMinutes ?? 540),
    archived: false,
    created_at: body.createdAt ?? Date.now(),
  });
  if (error) return c.json({ error: error.message }, 400);
  return c.json({ ok: true, id }, 201);
});

habitsRoutes.patch('/:id', async (c) => {
  const body = await c.req.json<any>();
  const patch: Record<string, unknown> = {};
  if (body.name !== undefined) patch.name = String(body.name).trim();
  if (body.emoji !== undefined) patch.emoji = body.emoji;
  if (body.color !== undefined) patch.color = body.color;
  if (body.category !== undefined) patch.category = body.category;
  if (body.notes !== undefined) patch.notes = body.notes;
  if (body.frequency !== undefined) patch.frequency = body.frequency;
  if (body.weekdaysMask !== undefined) patch.weekdays_mask = body.weekdaysMask;
  if (body.timesPerDay !== undefined) patch.times_per_day = body.timesPerDay;
  if (body.reminderEnabled !== undefined) patch.reminder_enabled = Boolean(body.reminderEnabled);
  if (body.reminderMinutes !== undefined) patch.reminder_minutes = Number(body.reminderMinutes);
  if (body.archived !== undefined) patch.archived = Boolean(body.archived);
  const { error } = await db(c)
    .from('habits')
    .update(patch)
    .eq('id', c.req.param('id'))
    .eq('user_id', c.get('userId'));
  if (error) return c.json({ error: error.message }, 400);
  return c.json({ ok: true });
});

habitsRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const userId = c.get('userId');
  const client = db(c);
  await client.from('habit_logs').delete().eq('habit_id', id).eq('user_id', userId);
  const { error } = await client.from('habits').delete().eq('id', id).eq('user_id', userId);
  if (error) return c.json({ error: error.message }, 400);
  return c.json({ ok: true });
});

habitsRoutes.post('/logs/:id/take', async (c) => {
  const { error } = await db(c)
    .from('habit_logs')
    .update({ taken_at: Date.now(), skipped: false })
    .eq('id', c.req.param('id'))
    .eq('user_id', c.get('userId'));
  if (error) return c.json({ error: error.message }, 400);
  return c.json({ ok: true });
});

habitsRoutes.post('/logs/:id/undo', async (c) => {
  const { error } = await db(c)
    .from('habit_logs')
    .update({ taken_at: null, skipped: false })
    .eq('id', c.req.param('id'))
    .eq('user_id', c.get('userId'));
  if (error) return c.json({ error: error.message }, 400);
  return c.json({ ok: true });
});
