import { listHabitLogsOnDay, listHabits, markHabitLog, upsertHabitLog } from '@/db/queries/habits';
import type { Habit, HabitLog } from '@/db/schema';
import { addLocalDays, endOfLocalDay, startOfLocalDay } from '@/domain/time';

export type TodayHabit = {
  habit: Habit;
  logs: HabitLog[];
  done: number;
  total: number;
  complete: boolean;
};

function weekday(dayStart: number) {
  return new Date(dayStart).getDay();
}

export function isHabitDueOnDay(habit: Habit, dayStart: number) {
  if (habit.archived) return false;
  const day = weekday(dayStart);
  if (habit.frequency === 'daily') return true;
  if (habit.frequency === 'weekdays') return day >= 1 && day <= 5;
  const mask = habit.weekdaysMask ?? 0;
  return (mask & (1 << day)) !== 0;
}

export function ensureHabitLogs(daysAhead = 1) {
  const start = startOfLocalDay();
  const habits = listHabits(false);
  for (let offset = 0; offset <= daysAhead; offset += 1) {
    const dayStart = addLocalDays(start, offset);
    const dayEnd = endOfLocalDay(dayStart);
    const existing = listHabitLogsOnDay(dayStart, dayEnd);
    for (const habit of habits) {
      if (!isHabitDueOnDay(habit, dayStart)) continue;
      const times = Math.max(1, habit.timesPerDay);
      for (let occurrence = 0; occurrence < times; occurrence += 1) {
        const already = existing.some(
          (log) => log.habitId === habit.id && log.occurrence === occurrence && log.scheduledFor === dayStart,
        );
        if (!already) {
          upsertHabitLog({ habitId: habit.id, scheduledFor: dayStart, occurrence });
        }
      }
    }
  }
}

export function listTodayHabits(): TodayHabit[] {
  ensureHabitLogs(0);
  const start = startOfLocalDay();
  const end = endOfLocalDay();
  const logs = listHabitLogsOnDay(start, end);
  return listHabits(false)
    .filter((habit) => isHabitDueOnDay(habit, start))
    .map((habit) => {
      const rows = logs
        .filter((log) => log.habitId === habit.id)
        .sort((a, b) => a.occurrence - b.occurrence);
      const done = rows.filter((log) => log.takenAt).length;
      const total = Math.max(rows.length, habit.timesPerDay);
      return { habit, logs: rows, done, total, complete: done >= total && total > 0 };
    })
    .sort((a, b) => Number(a.complete) - Number(b.complete) || a.habit.name.localeCompare(b.habit.name));
}

export function toggleTodayHabit(item: TodayHabit) {
  if (item.complete) {
    const last = [...item.logs].reverse().find((log) => log.takenAt);
    if (last) markHabitLog(last.id, false);
    return;
  }
  const next = item.logs.find((log) => !log.takenAt);
  if (next) markHabitLog(next.id, true);
}

export function habitStreak(habitId: string) {
  let streak = 0;
  const today = startOfLocalDay();
  const habit = listHabits(false).find((row) => row.id === habitId);
  if (!habit) return 0;
  for (let offset = 0; offset < 120; offset += 1) {
    const dayStart = addLocalDays(today, -offset);
    if (!isHabitDueOnDay(habit, dayStart)) {
      if (offset === 0) continue;
      continue;
    }
    const logs = listHabitLogsOnDay(dayStart, endOfLocalDay(dayStart)).filter((log) => log.habitId === habitId);
    const done = logs.filter((log) => log.takenAt).length;
    const total = Math.max(logs.length, habit.timesPerDay);
    const complete = total > 0 && done >= total;
    if (offset === 0 && !complete) continue;
    if (complete) {
      streak += 1;
      continue;
    }
    break;
  }
  return streak;
}

export function overallHabitStreak() {
  const due = listTodayHabits();
  if (due.length === 0) return 0;
  let streak = 0;
  const today = startOfLocalDay();
  const habits = listHabits(false);
  for (let offset = 0; offset < 120; offset += 1) {
    const dayStart = addLocalDays(today, -offset);
    const dueToday = habits.filter((habit) => isHabitDueOnDay(habit, dayStart));
    if (dueToday.length === 0) {
      if (offset === 0) continue;
      continue;
    }
    const logs = listHabitLogsOnDay(dayStart, endOfLocalDay(dayStart));
    const allDone = dueToday.every((habit) => {
      const rows = logs.filter((log) => log.habitId === habit.id);
      const done = rows.filter((log) => log.takenAt).length;
      return done >= Math.max(rows.length, habit.timesPerDay);
    });
    if (offset === 0 && !allDone) continue;
    if (allDone) {
      streak += 1;
      continue;
    }
    break;
  }
  return streak;
}
