import { listBodyWeights, listProgressPhotos } from '@/db/queries/body';
import { listDosesBetween } from '@/db/queries/doses';
import { listHabitLogsOnDay, listHabits } from '@/db/queries/habits';
import { listAllSupplements } from '@/db/queries/supplements';
import { listSetsForSession, listWorkoutSessions } from '@/db/queries/workouts';
import { overallStreak } from '@/domain/adherence';
import { isHabitDueOnDay, overallHabitStreak } from '@/domain/habits';
import { addLocalDays, eachLocalDay, endOfLocalDay, startOfLocalDay } from '@/domain/time';

export function startOfLocalWeek(ms: number = Date.now()): number {
  const start = startOfLocalDay(ms);
  const day = new Date(start).getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  return addLocalDays(start, mondayOffset);
}

export function formatWeekRange(weekStart: number): string {
  const end = addLocalDays(weekStart, 6);
  const fmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
  return `${fmt.format(new Date(weekStart))} – ${fmt.format(new Date(end))}`;
}

export type DayPulse = {
  dayStart: number;
  label: string;
  isToday: boolean;
  isFuture: boolean;
  stackDue: number;
  stackTaken: number;
  habitDue: number;
  habitDone: number;
  trained: boolean;
};

export type NamedRate = {
  id: string;
  name: string;
  done: number;
  due: number;
  pct: number;
};

export type WeekRecap = {
  weekStart: number;
  weekEnd: number;
  isCurrent: boolean;
  days: DayPulse[];
  stackDue: number;
  stackTaken: number;
  stackPct: number | null;
  habitDue: number;
  habitDone: number;
  habitPct: number | null;
  protocolPct: number | null;
  stackStreak: number;
  habitStreak: number;
  workouts: number;
  sets: number;
  volumeKg: number;
  weightStart: number | null;
  weightEnd: number | null;
  weightDelta: number | null;
  photos: number;
  supplements: NamedRate[];
  habits: NamedRate[];
  vsLast: {
    stackPct: number | null;
    habitPct: number | null;
    workouts: number;
    volumeKg: number;
  };
};

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function pct(done: number, due: number): number | null {
  if (due <= 0) return null;
  return Math.round((done / due) * 100);
}

function stackDay(dayStart: number, now: number) {
  const dayEnd = Math.min(endOfLocalDay(dayStart), now);
  if (dayStart > now) return { due: 0, taken: 0 };
  const doses = listDosesBetween(dayStart, dayEnd);
  return {
    due: doses.length,
    taken: doses.filter((dose) => Boolean(dose.takenAt)).length,
  };
}

function habitDay(dayStart: number, now: number) {
  if (dayStart > now) return { due: 0, done: 0 };
  const habits = listHabits(false).filter(
    (habit) => dayStart >= startOfLocalDay(habit.createdAt) && isHabitDueOnDay(habit, dayStart),
  );
  const logs = listHabitLogsOnDay(dayStart, endOfLocalDay(dayStart));
  let due = 0;
  let done = 0;
  for (const habit of habits) {
    const rows = logs.filter((log) => log.habitId === habit.id);
    const total = Math.max(rows.length, habit.timesPerDay);
    due += total;
    done += rows.filter((log) => log.takenAt).length;
  }
  return { due, done };
}

function workoutsInRange(from: number, to: number) {
  const sessions = listWorkoutSessions(80).filter(
    (session) => session.startedAt >= from && session.startedAt <= to && session.finishedAt,
  );
  let sets = 0;
  let volumeKg = 0;
  for (const session of sessions) {
    const rows = listSetsForSession(session.id).filter((set) => set.completed);
    sets += rows.length;
    for (const set of rows) volumeKg += set.weightKg * set.reps;
  }
  return { workouts: sessions.length, sets, volumeKg };
}

function weightAtOrBefore(at: number, weights: { loggedAt: number; weightKg: number }[]) {
  return weights.find((row) => row.loggedAt <= at)?.weightKg ?? null;
}

function supplementRates(weekStart: number, weekEnd: number, now: number): NamedRate[] {
  const end = Math.min(weekEnd, now);
  if (weekStart > now) return [];
  const doses = listDosesBetween(weekStart, end);
  const byId = new Map<string, { done: number; due: number }>();
  for (const dose of doses) {
    const row = byId.get(dose.supplementId) ?? { done: 0, due: 0 };
    row.due += 1;
    if (dose.takenAt) row.done += 1;
    byId.set(dose.supplementId, row);
  }
  const names = new Map(listAllSupplements().map((item) => [item.id, item.name]));
  return [...byId.entries()]
    .map(([id, row]) => ({
      id,
      name: names.get(id) ?? 'Supplement',
      done: row.done,
      due: row.due,
      pct: pct(row.done, row.due) ?? 0,
    }))
    .sort((a, b) => a.pct - b.pct || a.name.localeCompare(b.name));
}

function habitRates(weekStart: number, weekEnd: number, now: number): NamedRate[] {
  const habits = listHabits(false);
  return habits
    .map((habit) => {
      let due = 0;
      let done = 0;
      for (const dayStart of eachLocalDay(weekStart, addLocalDays(weekStart, 6))) {
        if (dayStart > now || dayStart > weekEnd) continue;
        if (dayStart < startOfLocalDay(habit.createdAt)) continue;
        if (!isHabitDueOnDay(habit, dayStart)) continue;
        const logs = listHabitLogsOnDay(dayStart, endOfLocalDay(dayStart)).filter((log) => log.habitId === habit.id);
        const total = Math.max(logs.length, habit.timesPerDay);
        due += total;
        done += logs.filter((log) => log.takenAt).length;
      }
      return {
        id: habit.id,
        name: habit.name,
        done,
        due,
        pct: pct(done, due) ?? 0,
      };
    })
    .filter((row) => row.due > 0)
    .sort((a, b) => a.pct - b.pct || a.name.localeCompare(b.name));
}

function weekTotals(weekStart: number, now: number) {
  const weekEnd = endOfLocalDay(addLocalDays(weekStart, 6));
  const sessions = listWorkoutSessions(80);
  let stackDue = 0;
  let stackTaken = 0;
  let habitDue = 0;
  let habitDone = 0;
  const today = startOfLocalDay(now);
  const days: DayPulse[] = eachLocalDay(weekStart, addLocalDays(weekStart, 6)).map((dayStart, index) => {
    const stack = stackDay(dayStart, now);
    const habits = habitDay(dayStart, now);
    stackDue += stack.due;
    stackTaken += stack.taken;
    habitDue += habits.due;
    habitDone += habits.done;
    const trained = sessions.some(
      (session) =>
        Boolean(session.finishedAt) &&
        session.startedAt >= dayStart &&
        session.startedAt <= endOfLocalDay(dayStart),
    );
    return {
      dayStart,
      label: DAY_LABELS[index] ?? '',
      isToday: dayStart === today,
      isFuture: dayStart > now,
      stackDue: stack.due,
      stackTaken: stack.taken,
      habitDue: habits.due,
      habitDone: habits.done,
      trained,
    };
  });

  const train = workoutsInRange(weekStart, weekEnd);
  const weights = listBodyWeights(90);
  const photos = listProgressPhotos().filter((photo) => photo.takenAt >= weekStart && photo.takenAt <= weekEnd).length;
  const weightEnd = weightAtOrBefore(Math.min(weekEnd, now), weights);
  const weightStart = weightAtOrBefore(weekStart - 1, weights) ?? weightEnd;
  const stackPct = pct(stackTaken, stackDue);
  const habitPct = pct(habitDone, habitDue);
  const protocolParts = [stackPct, habitPct].filter((value): value is number => value !== null);
  const protocolPct =
    protocolParts.length === 0
      ? null
      : Math.round(protocolParts.reduce((sum, value) => sum + value, 0) / protocolParts.length);

  return {
    weekStart,
    weekEnd,
    days,
    stackDue,
    stackTaken,
    stackPct,
    habitDue,
    habitDone,
    habitPct,
    protocolPct,
    workouts: train.workouts,
    sets: train.sets,
    volumeKg: train.volumeKg,
    weightStart,
    weightEnd,
    weightDelta: weightStart != null && weightEnd != null ? weightEnd - weightStart : null,
    photos,
    supplements: supplementRates(weekStart, weekEnd, now),
    habits: habitRates(weekStart, weekEnd, now),
  };
}

export function weekRecap(weekStart: number, now = Date.now()): WeekRecap {
  const current = startOfLocalWeek(now);
  const thisWeek = weekTotals(weekStart, now);
  const last = weekTotals(addLocalDays(weekStart, -7), now);
  return {
    ...thisWeek,
    isCurrent: weekStart === current,
    stackStreak: overallStreak(now),
    habitStreak: overallHabitStreak(),
    vsLast: {
      stackPct: last.stackPct,
      habitPct: last.habitPct,
      workouts: last.workouts,
      volumeKg: last.volumeKg,
    },
  };
}

export function recapHeadline(recap: WeekRecap): string {
  if (recap.protocolPct == null && recap.workouts === 0 && recap.weightDelta == null) {
    return recap.isCurrent ? 'Nothing logged yet' : 'A quiet week';
  }
  if (recap.protocolPct == null) {
    return recap.workouts > 0 ? 'Training week' : 'Keep logging';
  }
  if (recap.protocolPct >= 90) return 'Locked in';
  if (recap.protocolPct >= 70) return 'On protocol';
  if (recap.protocolPct >= 40) return 'Uneven week';
  return recap.isCurrent ? 'Still time' : 'Off protocol';
}

export function formatPct(value: number | null): string {
  return value == null ? '—' : `${value}%`;
}

export function formatDeltaPct(now: number | null, prev: number | null): string | null {
  if (now == null || prev == null) return null;
  const delta = now - prev;
  if (delta === 0) return 'same as last week';
  const sign = delta > 0 ? '+' : '';
  return `${sign}${delta} vs last week`;
}
