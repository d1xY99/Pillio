import type { Schedule } from '@/db/schema';
import type { ScheduleFrequency } from '@/db/types';
import { daysBetweenLocal, startOfLocalDay } from '@/domain/time';

export const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;
export const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export const ALL_WEEKDAYS_MASK = 0b1111111;

export function weekdayBit(jsDay: number): number {
  return 1 << jsDay;
}

export function hasWeekday(mask: number, jsDay: number): boolean {
  return (mask & weekdayBit(jsDay)) !== 0;
}

export function toggleWeekday(mask: number, jsDay: number): number {
  return mask ^ weekdayBit(jsDay);
}

export type ScheduleDraft = {
  times: number[];
  frequency: ScheduleFrequency;
  intervalDays: number;
  weekdaysMask: number;
  cycleOnDays: number;
  cycleOffDays: number;
  reminderEnabled: boolean;
  startDate: number;
};

export const DEFAULT_SCHEDULE: ScheduleDraft = {
  times: [9 * 60],
  frequency: 'daily',
  intervalDays: 2,
  weekdaysMask: ALL_WEEKDAYS_MASK,
  cycleOnDays: 5,
  cycleOffDays: 2,
  reminderEnabled: true,
  startDate: startOfLocalDay(),
};

export function draftFromSchedules(rows: Schedule[]): ScheduleDraft {
  if (rows.length === 0) {
    return { ...DEFAULT_SCHEDULE, startDate: startOfLocalDay() };
  }

  const first = rows[0];
  return {
    times: [...new Set(rows.map((row) => row.timeMinutes))].sort((a, b) => a - b),
    frequency: first.frequency as ScheduleFrequency,
    intervalDays: first.intervalDays ?? 2,
    weekdaysMask: first.weekdaysMask ?? ALL_WEEKDAYS_MASK,
    cycleOnDays: first.cycleOnDays ?? 5,
    cycleOffDays: first.cycleOffDays ?? 2,
    reminderEnabled: first.reminderEnabled,
    startDate: startOfLocalDay(first.startDate),
  };
}

export function isScheduleDueOnDay(schedule: Schedule, dayStart: number): boolean {
  if (!schedule.active) return false;

  const start = startOfLocalDay(schedule.startDate);
  if (dayStart < start) return false;
  if (schedule.endDate && dayStart > startOfLocalDay(schedule.endDate)) return false;

  const elapsed = daysBetweenLocal(start, dayStart);

  switch (schedule.frequency) {
    case 'daily':
      return true;
    case 'every_n_days': {
      const interval = Math.max(1, schedule.intervalDays ?? 1);
      return elapsed % interval === 0;
    }
    case 'weekly': {
      const mask = schedule.weekdaysMask;
      if (mask) return hasWeekday(mask, new Date(dayStart).getDay());
      return elapsed % 7 === 0;
    }
    case 'weekdays':
      return hasWeekday(schedule.weekdaysMask ?? 0, new Date(dayStart).getDay());
    case 'cycle': {
      const on = Math.max(1, schedule.cycleOnDays ?? 1);
      const off = Math.max(0, schedule.cycleOffDays ?? 0);
      const period = on + off;
      return elapsed % period < on;
    }
    default:
      return false;
  }
}

export function isWeeklySchedule(schedule: Schedule): boolean {
  if (schedule.frequency === 'weekly') return true;
  if (schedule.frequency === 'every_n_days' && (schedule.intervalDays ?? 0) === 7) return true;
  if (schedule.frequency === 'weekdays') {
    const mask = schedule.weekdaysMask ?? 0;
    const count = mask.toString(2).split('').filter((bit) => bit === '1').length;
    return count === 1;
  }
  return false;
}

export function describeSchedule(draft: ScheduleDraft): string {
  const times = draft.times
    .slice()
    .sort((a, b) => a - b)
    .map((minutes) =>
      new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(
        new Date(2000, 0, 1, Math.floor(minutes / 60), minutes % 60),
      ),
    )
    .join(', ');

  switch (draft.frequency) {
    case 'daily':
      return `Daily at ${times}`;
    case 'weekly': {
      const day = WEEKDAY_NAMES.find((_, index) => hasWeekday(draft.weekdaysMask, index)) ?? 'a set day';
      return `Weekly on ${day} at ${times}`;
    }
    case 'every_n_days':
      return `Every ${draft.intervalDays} days at ${times}`;
    case 'weekdays': {
      const days = WEEKDAY_NAMES.filter((_, index) => hasWeekday(draft.weekdaysMask, index)).join(', ');
      return `${days || 'No days'} at ${times}`;
    }
    case 'cycle':
      return `${draft.cycleOnDays} on / ${draft.cycleOffDays} off at ${times}`;
    default:
      return times;
  }
}
