import { Hono } from 'hono';

import { db, requireUser, type AuthEnv } from '../lib/auth';
import * as map from '../lib/map';
import { isScheduleDueOnDay, type ScheduleRow } from '../lib/schedule';
import { addClientDays, eachClientDay, endOfClientDay, startOfClientDay } from '../lib/time';
import { tzFromQuery } from '../lib/tz';

export const stackRoutes = new Hono<AuthEnv>();
stackRoutes.use('*', requireUser);

stackRoutes.get('/', async (c) => {
  const archived = c.req.query('archived') === '1' || c.req.query('archived') === 'true';
  const userId = c.get('userId');
  const client = db(c);
  const [supRes, schRes] = await Promise.all([
    client.from('supplements').select('*').eq('user_id', userId).eq('archived', archived).order('name'),
    client.from('schedules').select('*').eq('user_id', userId),
  ]);
  map.throwIf(supRes.error);
  map.throwIf(schRes.error);
  return c.json({
    items: (supRes.data ?? []).map(map.supplement),
    schedules: (schRes.data ?? []).map(map.schedule),
  });
});

stackRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');
  const tz = tzFromQuery(c.req.query('tzOffset'));
  const userId = c.get('userId');
  const client = db(c);
  const [itemRes, schRes, doseRes] = await Promise.all([
    client.from('supplements').select('*').eq('id', id).eq('user_id', userId).maybeSingle(),
    client.from('schedules').select('*').eq('supplement_id', id).eq('user_id', userId).eq('active', true),
    client
      .from('dose_logs')
      .select('*')
      .eq('supplement_id', id)
      .eq('user_id', userId)
      .order('scheduled_for', { ascending: false })
      .limit(80),
  ]);
  if (itemRes.error || !itemRes.data) return c.json({ error: 'Item not found' }, 404);
  const item = map.supplement(itemRes.data);
  const schedules = (schRes.data ?? []).map(map.schedule);
  const history = (doseRes.data ?? []).map(map.dose);
  return c.json({
    item,
    schedules,
    history,
    heat: adherenceDays(id, schedules as ScheduleRow[], history, tz),
  });
});

stackRoutes.post('/', async (c) => {
  const body = await c.req.json<any>();
  const userId = c.get('userId');
  const client = db(c);
  const id = body.id || crypto.randomUUID();
  const createdAt = Date.now();
  const { error } = await client.from('supplements').insert({
    id,
    user_id: userId,
    name: String(body.name ?? '').trim(),
    type: body.type,
    form: body.form,
    default_amount: Number(body.defaultAmount),
    default_unit: body.defaultUnit,
    color: body.color,
    notes: body.notes?.trim() || null,
    vial_mg: body.vialMg == null || body.vialMg === '' ? null : Number(body.vialMg),
    bac_ml: body.bacMl == null || body.bacMl === '' ? null : Number(body.bacMl),
    draw_display: body.drawDisplay === 'ml' ? 'ml' : 'units',
    archived: false,
    created_at: createdAt,
  });
  if (error) return c.json({ error: error.message }, 400);
  if (body.schedule) await writeSchedule(client, userId, id, body.schedule);
  const item = await loadItem(client, userId, id);
  return c.json(item, 201);
});

stackRoutes.patch('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json<any>();
  const userId = c.get('userId');
  const client = db(c);
  const patch: Record<string, unknown> = {};
  if (body.name !== undefined) patch.name = String(body.name).trim();
  if (body.type !== undefined) patch.type = body.type;
  if (body.form !== undefined) patch.form = body.form;
  if (body.defaultAmount !== undefined) patch.default_amount = Number(body.defaultAmount);
  if (body.defaultUnit !== undefined) patch.default_unit = body.defaultUnit;
  if (body.color !== undefined) patch.color = body.color;
  if (body.notes !== undefined) patch.notes = body.notes?.trim() || null;
  if (body.vialMg !== undefined) patch.vial_mg = body.vialMg == null || body.vialMg === '' ? null : Number(body.vialMg);
  if (body.bacMl !== undefined) patch.bac_ml = body.bacMl == null || body.bacMl === '' ? null : Number(body.bacMl);
  if (body.drawDisplay !== undefined) patch.draw_display = body.drawDisplay === 'ml' ? 'ml' : 'units';
  if (body.type !== undefined && body.type !== 'peptide') {
    patch.vial_mg = null;
    patch.bac_ml = null;
  }
  if (Object.keys(patch).length) {
    const { error } = await client.from('supplements').update(patch).eq('id', id).eq('user_id', userId);
    if (error) return c.json({ error: error.message }, 400);
  }
  if (body.schedule) await writeSchedule(client, userId, id, body.schedule);
  const item = await loadItem(client, userId, id);
  if (!item) return c.json({ error: 'Item not found' }, 404);
  return c.json(item);
});

stackRoutes.post('/:id/archive', async (c) => {
  const body = await c.req.json<{ archived?: boolean }>().catch(() => ({ archived: true }));
  const { error } = await db(c)
    .from('supplements')
    .update({ archived: Boolean(body.archived) })
    .eq('id', c.req.param('id'))
    .eq('user_id', c.get('userId'));
  if (error) return c.json({ error: error.message }, 400);
  return c.json({ ok: true, archived: Boolean(body.archived) });
});

stackRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const userId = c.get('userId');
  const client = db(c);
  await client.from('dose_logs').delete().eq('supplement_id', id).eq('user_id', userId);
  await client.from('schedules').delete().eq('supplement_id', id).eq('user_id', userId);
  const { error } = await client.from('supplements').delete().eq('id', id).eq('user_id', userId);
  if (error) return c.json({ error: error.message }, 400);
  return c.json({ ok: true });
});

async function loadItem(client: ReturnType<typeof db>, userId: string, id: string) {
  const [itemRes, schRes] = await Promise.all([
    client.from('supplements').select('*').eq('id', id).eq('user_id', userId).maybeSingle(),
    client.from('schedules').select('*').eq('supplement_id', id).eq('user_id', userId),
  ]);
  if (!itemRes.data) return null;
  return { item: map.supplement(itemRes.data), schedules: (schRes.data ?? []).map(map.schedule) };
}

async function writeSchedule(client: ReturnType<typeof db>, userId: string, supplementId: string, draft: any) {
  const existing = await client.from('schedules').select('id').eq('supplement_id', supplementId).eq('user_id', userId);
  const ids = (existing.data ?? []).map((row) => row.id);
  if (ids.length) {
    await client
      .from('dose_logs')
      .delete()
      .in('schedule_id', ids)
      .is('taken_at', null)
      .eq('skipped', false)
      .gte('scheduled_for', Date.now());
    await client.from('schedules').update({ active: false }).eq('supplement_id', supplementId).eq('user_id', userId);
  }

  const times: number[] = Array.isArray(draft.times) ? draft.times : [];
  if (!times.length) return;
  const rows = times.map((timeMinutes) => ({
    id: crypto.randomUUID(),
    user_id: userId,
    supplement_id: supplementId,
    time_minutes: timeMinutes,
    frequency: draft.frequency,
    interval_days: draft.frequency === 'every_n_days' ? draft.intervalDays : draft.frequency === 'weekly' ? 7 : null,
    weekdays_mask:
      draft.frequency === 'weekdays' || draft.frequency === 'weekly' ? draft.weekdaysMask : null,
    cycle_on_days: draft.frequency === 'cycle' ? draft.cycleOnDays : null,
    cycle_off_days: draft.frequency === 'cycle' ? draft.cycleOffDays : null,
    reminder_enabled: draft.reminderEnabled ?? true,
    start_date: draft.startDate ?? Date.now(),
    end_date: null,
    active: true,
  }));
  const { error } = await client.from('schedules').insert(rows);
  map.throwIf(error);
}

function adherenceDays(supplementId: string, schedules: ScheduleRow[], history: map.DoseLog[], tz: number) {
  const dayCount = 84;
  const today = startOfClientDay(Date.now(), tz);
  const from = addClientDays(today, 1 - dayCount, tz);
  if (schedules.length === 0) {
    return eachClientDay(from, today, tz).map((dayStart) => ({ dayStart, status: 'none' as const }));
  }
  const now = Date.now();
  return eachClientDay(from, today, tz).map((dayStart) => {
    const dayEnd = endOfClientDay(dayStart, tz);
    const due = history.filter((dose) => dose.scheduledFor >= dayStart && dose.scheduledFor <= dayEnd);
    if (due.length === 0) {
      const should = schedules.some((schedule) => isScheduleDueOnDay(schedule, dayStart, tz));
      return { dayStart, status: should ? (dayEnd >= now ? 'pending' : 'missed') : 'none' };
    }
    const taken = due.filter((dose) => dose.takenAt).length;
    const skipped = due.filter((dose) => dose.skipped).length;
    if (taken === due.length) return { dayStart, status: 'taken' as const };
    if (taken + skipped === due.length && taken > 0) return { dayStart, status: 'partial' as const };
    if (dayEnd >= now) return { dayStart, status: 'pending' as const };
    if (taken > 0) return { dayStart, status: 'partial' as const };
    return { dayStart, status: 'missed' as const };
  });
}
