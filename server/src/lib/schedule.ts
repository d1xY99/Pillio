import { daysBetweenClient, localWeekday } from './time';

export type ScheduleRow = {
  id: string;
  supplementId: string;
  timeMinutes: number;
  frequency: string;
  intervalDays: number | null;
  weekdaysMask: number | null;
  cycleOnDays: number | null;
  cycleOffDays: number | null;
  reminderEnabled: boolean;
  startDate: number;
  endDate: number | null;
  active: boolean;
};

function hasWeekday(mask: number, jsDay: number) {
  return (mask & (1 << jsDay)) !== 0;
}

export function isScheduleDueOnDay(schedule: ScheduleRow, dayStart: number, tzOffsetMin: number) {
  if (!schedule.active) return false;
  const start = schedule.startDate;
  if (dayStart < start) return false;
  if (schedule.endDate && dayStart > schedule.endDate) return false;

  const elapsed = daysBetweenClient(start, dayStart, tzOffsetMin);
  const weekday = localWeekday(dayStart, tzOffsetMin);

  switch (schedule.frequency) {
    case 'daily':
      return true;
    case 'every_n_days': {
      const interval = Math.max(1, schedule.intervalDays ?? 1);
      return elapsed % interval === 0;
    }
    case 'weekly': {
      const mask = schedule.weekdaysMask;
      if (mask) return hasWeekday(mask, weekday);
      return elapsed % 7 === 0;
    }
    case 'weekdays':
      return hasWeekday(schedule.weekdaysMask ?? 0, weekday);
    case 'cycle': {
      const on = Math.max(1, schedule.cycleOnDays ?? 1);
      const off = Math.max(0, schedule.cycleOffDays ?? 0);
      return elapsed % (on + off) < on;
    }
    default:
      return false;
  }
}

export function isWeeklySchedule(schedule: ScheduleRow) {
  if (schedule.frequency === 'weekly') return true;
  if (schedule.frequency === 'every_n_days' && (schedule.intervalDays ?? 0) === 7) return true;
  if (schedule.frequency === 'weekdays') {
    const mask = schedule.weekdaysMask ?? 0;
    const count = mask.toString(2).split('').filter((bit) => bit === '1').length;
    return count === 1;
  }
  return false;
}

export const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
