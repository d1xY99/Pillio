import { listDosesBetween, upsertScheduledDose } from '@/db/queries/doses';
import { listActiveSchedules, listSchedulesForSupplement, replaceSchedulesForSupplement } from '@/db/queries/schedules';
import { listAllSupplements } from '@/db/queries/supplements';
import type { DoseLog, Schedule, Supplement } from '@/db/schema';
import type { DoseUnit } from '@/db/types';
import {
  isScheduleDueOnDay,
  isWeeklySchedule,
  WEEKDAY_NAMES,
  type ScheduleDraft,
} from '@/domain/schedule';
import {
  addLocalDays,
  eachLocalDay,
  endOfLocalDay,
  startOfLocalDay,
  timestampForTimeOnDay,
} from '@/domain/time';
import { schedulePush } from '@/sync/cloud';

export type TodayDose = DoseLog & {
  supplement: Supplement;
  overdue: boolean;
};

export function ensureDosesForRange(fromMs: number, toMs: number) {
  const schedules = listActiveSchedules();
  const catalog = new Map(listAllSupplements().map((item) => [item.id, item]));

  for (const dayStart of eachLocalDay(fromMs, toMs)) {
    for (const schedule of schedules) {
      const supplement = catalog.get(schedule.supplementId);
      if (!supplement || supplement.archived) continue;
      if (!isScheduleDueOnDay(schedule, dayStart)) continue;

      upsertScheduledDose({
        supplementId: schedule.supplementId,
        scheduleId: schedule.id,
        scheduledFor: timestampForTimeOnDay(dayStart, schedule.timeMinutes),
        amount: supplement.defaultAmount,
        unit: supplement.defaultUnit as DoseUnit,
      });
    }
  }
}

export function ensureUpcomingDoses(daysAhead = 7) {
  const start = startOfLocalDay();
  const end = endOfLocalDay(start + daysAhead * 24 * 60 * 60 * 1000);
  ensureDosesForRange(start, end);
}

export function isWeeklySupplement(supplementId: string): boolean {
  return listSchedulesForSupplement(supplementId).some(isWeeklySchedule);
}

export function listTodayDoses(now = Date.now()): TodayDose[] {
  const start = startOfLocalDay(now);
  const end = endOfLocalDay(now);
  const activeIds = new Set(listActiveSchedules().map((row) => row.id));
  const catalog = new Map(listAllSupplements().map((item) => [item.id, item]));

  return listDosesBetween(start, end)
    .filter((dose) => {
      if (dose.takenAt || dose.skipped) return true;
      if (!dose.scheduleId) return true;
      return activeIds.has(dose.scheduleId);
    })
    .flatMap((dose) => {
      const supplement = catalog.get(dose.supplementId);
      if (!supplement || supplement.archived) return [];
      return [
        {
          ...dose,
          supplement,
          overdue: !dose.takenAt && !dose.skipped && dose.scheduledFor < now,
        },
      ];
    })
    .sort((a, b) => a.scheduledFor - b.scheduledFor || a.supplement.name.localeCompare(b.supplement.name));
}

export function listParkedWeekly(now = Date.now()): { supplement: Supplement; nextLabel: string }[] {
  const dueToday = new Set(
    listTodayDoses(now)
      .filter((dose) => isWeeklySupplement(dose.supplementId))
      .map((dose) => dose.supplementId),
  );

  return listAllSupplements()
    .filter((item) => !item.archived && isWeeklySupplement(item.id) && !dueToday.has(item.id))
    .map((supplement) => ({
      supplement,
      nextLabel: nextWeeklyDayLabel(supplement.id, now),
    }))
    .sort((a, b) => a.supplement.name.localeCompare(b.supplement.name));
}

function nextWeeklyDayLabel(supplementId: string, now: number): string {
  const schedules = listSchedulesForSupplement(supplementId);
  for (let offset = 1; offset <= 7; offset += 1) {
    const day = addLocalDays(startOfLocalDay(now), offset);
    if (schedules.some((schedule) => isScheduleDueOnDay(schedule, day))) {
      return WEEKDAY_NAMES[new Date(day).getDay()];
    }
  }
  return 'Later';
}

export function groupDosesByTime(doses: TodayDose[]): { time: number; items: TodayDose[] }[] {
  const groups = new Map<number, TodayDose[]>();
  for (const dose of doses) {
    const key = new Date(dose.scheduledFor).getHours() * 60 + new Date(dose.scheduledFor).getMinutes();
    const list = groups.get(key) ?? [];
    list.push(dose);
    groups.set(key, list);
  }
  return [...groups.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([time, items]) => ({ time, items }));
}

export function listDosesForScheduleRange(schedule: Schedule, fromMs: number, toMs: number): DoseLog[] {
  return listDosesBetween(fromMs, toMs).filter((dose) => dose.scheduleId === schedule.id);
}

export function saveSchedules(supplementId: string, draft: ScheduleDraft) {
  if (draft.times.length === 0) {
    replaceSchedulesForSupplement(supplementId, []);
    return;
  }

  replaceSchedulesForSupplement(
    supplementId,
    draft.times.map((timeMinutes) => ({
      timeMinutes,
      frequency: draft.frequency,
      intervalDays:
        draft.frequency === 'every_n_days' ? draft.intervalDays : draft.frequency === 'weekly' ? 7 : null,
      weekdaysMask:
        draft.frequency === 'weekdays' || draft.frequency === 'weekly' ? draft.weekdaysMask : null,
      cycleOnDays: draft.frequency === 'cycle' ? draft.cycleOnDays : null,
      cycleOffDays: draft.frequency === 'cycle' ? draft.cycleOffDays : null,
      reminderEnabled: draft.reminderEnabled,
      startDate: startOfLocalDay(draft.startDate),
      active: true,
    })),
  );
  ensureUpcomingDoses();
  schedulePush();
}
