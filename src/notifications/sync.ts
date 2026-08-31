import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { getSchedule } from '@/db/queries/schedules';
import { getSupplement } from '@/db/queries/supplements';
import { formatDose } from '@/constants/catalog';
import { listDosesBetween } from '@/db/queries/doses';
import { ensureUpcomingDoses, listTodayDoses } from '@/domain/doses';
import { addLocalDays, endOfLocalDay, startOfLocalDay } from '@/domain/time';
import { ensureAndroidChannel, getReminderPermission } from '@/notifications/permissions';

const PREFIX = 'dose-';

function notificationId(doseId: string) {
  return `${PREFIX}${doseId}`;
}

export async function cancelDoseNotification(doseId: string) {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId(doseId));
  } catch {
    // already gone
  }
}

export async function syncDoseReminders() {
  if (Platform.OS === 'web') {
    const { syncWebReminders } = await import('@/notifications/web');
    await syncWebReminders();
    return;
  }

  const permission = await getReminderPermission();
  if (permission !== 'granted') {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch {
      // ignore
    }
    return;
  }

  await ensureAndroidChannel();
  ensureUpcomingDoses();

  const now = Date.now();
  const from = now + 1500;
  const to = endOfLocalDay(addLocalDays(startOfLocalDay(now), 7));
  const open = listDosesBetween(from, to).filter((dose) => !dose.takenAt && !dose.skipped);

  const wanted = new Map<
    string,
    { title: string; body: string; date: number; doseId: string }
  >();

  for (const dose of open) {
    if (!dose.scheduleId) continue;
    const schedule = getSchedule(dose.scheduleId);
    if (!schedule?.reminderEnabled || !schedule.active) continue;
    const supplement = getSupplement(dose.supplementId);
    if (!supplement || supplement.archived) continue;

    wanted.set(notificationId(dose.id), {
      doseId: dose.id,
      date: dose.scheduledFor,
      title: supplement.name,
      body: `${formatDose(dose.amount, dose.unit)} is still unchecked.`,
    });
  }

  const pending = await Notifications.getAllScheduledNotificationsAsync();
  const pendingIds = new Set(pending.map((item) => item.identifier));

  for (const item of pending) {
    if (!item.identifier.startsWith(PREFIX)) continue;
    if (!wanted.has(item.identifier)) {
      await Notifications.cancelScheduledNotificationAsync(item.identifier);
    }
  }

  for (const [identifier, payload] of wanted) {
    if (pendingIds.has(identifier)) continue;
    await Notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title: payload.title,
        body: payload.body,
        sound: true,
        data: { doseId: payload.doseId },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: payload.date,
        channelId: 'doses',
      },
    });
  }

  const remaining = listTodayDoses().filter((dose) => !dose.takenAt && !dose.skipped).length;
  await Notifications.setBadgeCountAsync(remaining);
}

export async function onDoseTaken(doseId: string) {
  await cancelDoseNotification(doseId);
  await syncDoseReminders();
}

export async function onDoseOpened() {
  await syncDoseReminders();
}
