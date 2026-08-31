import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export async function getReminderPermission(): Promise<'granted' | 'denied' | 'undetermined'> {
  if (Platform.OS === 'web') return 'denied';
  const { status } = await Notifications.getPermissionsAsync();
  if (status === 'granted') return 'granted';
  if (status === 'denied') return 'denied';
  return 'undetermined';
}

export async function requestReminderPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.status === 'granted') return true;

  const requested = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });
  return requested.status === 'granted';
}

export async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('doses', {
    name: 'Dose reminders',
    importance: Notifications.AndroidImportance.HIGH,
  });
}

export async function sendTestReminder(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const granted = await requestReminderPermission();
  if (!granted) return false;
  await ensureAndroidChannel();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Pillio',
      body: 'Reminders work. A real dose alert will look like this if it is still unchecked at the due time.',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 8,
    },
  });
  return true;
}
