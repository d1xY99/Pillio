import { Hono } from 'hono';

import { db, requireUser, type AuthEnv } from '../lib/auth';
import * as map from '../lib/map';
import { isScheduleDueOnDay, isWeeklySchedule, WEEKDAY_NAMES, type ScheduleRow } from '../lib/schedule';
import {
  addClientDays,
  eachClientDay,
  endOfClientDay,
  localWeekday,
  startOfClientDay,
  timestampForTimeOnDay,
} from '../lib/time';
import { tzFromQuery } from '../lib/tz';

export const todayRoutes = new Hono<AuthEnv>();

todayRoutes.use('*', requireUser);

todayRoutes.get('/', async (c) => {
  const tz = tzFromQuery(c.req.query('tzOffset'));
  const now = Number(c.req.query('now')) || Date.now();
  const from = Number(c.req.query('from')) || startOfClientDay(now, tz);
  const to = Number(c.req.query('to')) || endOfClientDay(now, tz);
  const client = db(c);
  const userId = c.get('userId');

  const [supRes, schRes, doseRes] = await Promise.all([
    client.from('supplements').select('*').eq('user_id', userId),
    client.from('schedules').select('*').eq('user_id', userId),
    client.from('dose_logs').select('*').eq('user_id', userId),
  ]);
  map.throwIf(supRes.error);
  map.throwIf(schRes.error);
  map.throwIf(doseRes.error);

  const supplements = (supRes.data ?? []).map(map.supplement);
  const schedules = (schRes.data ?? []).map(map.schedule);
  let doses = (doseRes.data ?? []).map(map.dose);

  const generated = await ensureDoses({
    userId,
    client,
    supplements,
    schedules: schedules.filter((row) => row.active) as ScheduleRow[],
    existing: doses,
    from,
    horizon: endOfClientDay(addClientDays(from, 7, tz), tz),
    tz,
  });
  if (generated.length) doses = [...doses, ...generated];

  const catalog = new Map(supplements.map((item) => [item.id, item]));
  const activeIds = new Set(schedules.filter((row) => row.active).map((row) => row.id));

  const todayDoses = doses
    .filter((dose) => dose.scheduledFor >= from && dose.scheduledFor <= to)
    .filter((dose) => {
      if (dose.takenAt || dose.skipped) return true;
      if (!dose.scheduleId) return true;
      return activeIds.has(dose.scheduleId);
    })
    .flatMap((dose) => {
      const item = catalog.get(dose.supplementId);
      if (!item || item.archived) return [];
      return [
        {
          ...dose,
          supplement: item,
          overdue: !dose.takenAt && !dose.skipped && dose.scheduledFor < now,
        },
      ];
    })
    .sort((a, b) => a.scheduledFor - b.scheduledFor || a.supplement.name.localeCompare(b.supplement.name));

  const dueWeekly = new Set(
    todayDoses
      .filter((dose) => schedules.some((row) => row.supplementId === dose.supplementId && isWeeklySchedule(row)))
      .map((dose) => dose.supplementId),
  );

  const parkedWeekly = supplements
    .filter((item) => !item.archived && !dueWeekly.has(item.id))
    .filter((item) => schedules.some((row) => row.supplementId === item.id && isWeeklySchedule(row)))
    .map((item) => ({
      supplement: item,
      nextLabel: nextWeeklyLabel(item.id, schedules as ScheduleRow[], now, tz),
    }));

  return c.json({
    supplements,
    schedules,
    doseLogs: doses,
    doses: todayDoses,
    parkedWeekly,
    streak: overallStreak(doses, now, tz),
  });
});

todayRoutes.post('/doses/:id/take', async (c) => {
  const id = c.req.param('id');
  const body = (await c.req.json<{ amount?: number; unit?: string; takenAt?: number }>().catch(() => ({}))) as {
    amount?: number;
    unit?: string;
    takenAt?: number;
  };
  const takenAt = body.takenAt ?? Date.now();
  const patch: Record<string, unknown> = { taken_at: takenAt, skipped: false };
  if (body.amount !== undefined) patch.amount = body.amount;
  if (body.unit !== undefined) patch.unit = body.unit;
  const { data, error } = await db(c)
    .from('dose_logs')
    .update(patch)
    .eq('id', id)
    .eq('user_id', c.get('userId'))
    .select('*')
    .single();
  if (error || !data) return c.json({ error: error?.message ?? 'Dose not found' }, 404);
  return c.json({ dose: map.dose(data) });
});

todayRoutes.post('/doses/:id/undo', async (c) => {
  const { data, error } = await db(c)
    .from('dose_logs')
    .update({ taken_at: null, skipped: false })
    .eq('id', c.req.param('id'))
    .eq('user_id', c.get('userId'))
    .select('*')
    .single();
  if (error || !data) return c.json({ error: error?.message ?? 'Dose not found' }, 404);
  return c.json({ dose: map.dose(data) });
});

todayRoutes.post('/doses/:id/skip', async (c) => {
  const { data, error } = await db(c)
    .from('dose_logs')
    .update({ skipped: true, taken_at: null })
    .eq('id', c.req.param('id'))
    .eq('user_id', c.get('userId'))
    .select('*')
    .single();
  if (error || !data) return c.json({ error: error?.message ?? 'Dose not found' }, 404);
  return c.json({ dose: map.dose(data) });
});

async function ensureDoses(input: {
  userId: string;
  client: ReturnType<typeof db>;
  supplements: map.Supplement[];
  schedules: ScheduleRow[];
  existing: map.DoseLog[];
  from: number;
  horizon: number;
  tz: number;
}) {
  const catalog = new Map(input.supplements.map((item) => [item.id, item]));
  const have = new Set(
    input.existing.map((dose) => `${dose.scheduleId}:${dose.scheduledFor}`),
  );
  const rows: Record<string, unknown>[] = [];

  for (const dayStart of eachClientDay(input.from, input.horizon, input.tz)) {
    for (const schedule of input.schedules) {
      const item = catalog.get(schedule.supplementId);
      if (!item || item.archived) continue;
      if (!isScheduleDueOnDay(schedule, dayStart, input.tz)) continue;
      const scheduledFor = timestampForTimeOnDay(dayStart, schedule.timeMinutes);
      if (have.has(`${schedule.id}:${scheduledFor}`)) continue;
      rows.push({
        id: crypto.randomUUID(),
        user_id: input.userId,
        supplement_id: schedule.supplementId,
        schedule_id: schedule.id,
        scheduled_for: scheduledFor,
        taken_at: null,
        skipped: false,
        amount: item.defaultAmount,
        unit: item.defaultUnit,
        notes: null,
      });
    }
  }

  if (!rows.length) return [] as map.DoseLog[];
  const { data, error } = await input.client.from('dose_logs').upsert(rows).select('*');
  map.throwIf(error);
  return (data ?? []).map(map.dose);
}

function nextWeeklyLabel(supplementId: string, schedules: ScheduleRow[], now: number, tz: number) {
  const rows = schedules.filter((row) => row.supplementId === supplementId);
  const start = startOfClientDay(now, tz);
  for (let offset = 1; offset <= 7; offset += 1) {
    const day = addClientDays(start, offset, tz);
    if (rows.some((schedule) => isScheduleDueOnDay(schedule, day, tz))) {
      return WEEKDAY_NAMES[localWeekday(day, tz)] ?? 'Later';
    }
  }
  return 'Later';
}

function overallStreak(doses: map.DoseLog[], now: number, tz: number) {
  let streak = 0;
  const today = startOfClientDay(now, tz);
  for (let offset = 0; offset < 120; offset += 1) {
    const dayStart = addClientDays(today, -offset, tz);
    const dayEnd = endOfClientDay(dayStart, tz);
    const due = doses.filter((dose) => dose.scheduledFor >= dayStart && dose.scheduledFor <= dayEnd);
    if (due.length === 0) continue;
    const allTaken = due.every((dose) => Boolean(dose.takenAt));
    if (offset === 0 && !allTaken) continue;
    if (allTaken) {
      streak += 1;
      continue;
    }
    break;
  }
  return streak;
}
