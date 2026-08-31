import { listDoseHistory, listDosesBetween } from '@/db/queries/doses';
import { listSchedulesForSupplement } from '@/db/queries/schedules';
import { addLocalDays, eachLocalDay, endOfLocalDay, startOfLocalDay } from '@/domain/time';

export type HeatStatus = 'none' | 'taken' | 'missed' | 'partial' | 'pending';

export type HeatDay = {
  dayStart: number;
  status: HeatStatus;
};

export function adherenceDays(supplementId: string, dayCount = 84): HeatDay[] {
  const schedules = listSchedulesForSupplement(supplementId);
  if (schedules.length === 0) {
    return eachLocalDay(addLocalDays(startOfLocalDay(), 1 - dayCount), startOfLocalDay()).map((dayStart) => ({
      dayStart,
      status: 'none' as const,
    }));
  }

  const from = addLocalDays(startOfLocalDay(), 1 - dayCount);
  const to = endOfLocalDay();
  const doses = listDosesBetween(from, to).filter((dose) => dose.supplementId === supplementId);
  const now = Date.now();

  return eachLocalDay(from, startOfLocalDay()).map((dayStart) => {
    const dayEnd = endOfLocalDay(dayStart);
    const due = doses.filter((dose) => dose.scheduledFor >= dayStart && dose.scheduledFor <= dayEnd);
    if (due.length === 0) return { dayStart, status: 'none' as const };

    const taken = due.filter((dose) => dose.takenAt).length;
    const skipped = due.filter((dose) => dose.skipped).length;
    const resolved = taken + skipped;

    if (taken === due.length) return { dayStart, status: 'taken' };
    if (resolved === due.length && taken > 0) return { dayStart, status: 'partial' };
    if (dayEnd >= now) return { dayStart, status: 'pending' };
    if (taken > 0) return { dayStart, status: 'partial' };
    return { dayStart, status: 'missed' };
  });
}

export function streakCount(supplementId: string): number {
  const days = adherenceDays(supplementId, 120).reverse();
  let streak = 0;
  for (const day of days) {
    if (day.status === 'none' || day.status === 'pending') continue;
    if (day.status === 'taken') {
      streak += 1;
      continue;
    }
    break;
  }
  return streak;
}

export function overallStreak(now = Date.now()): number {
  let streak = 0;
  const today = startOfLocalDay(now);

  for (let offset = 0; offset < 120; offset += 1) {
    const dayStart = addLocalDays(today, -offset);
    const dayEnd = endOfLocalDay(dayStart);
    const due = listDosesBetween(dayStart, dayEnd);
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

export { listDoseHistory };
