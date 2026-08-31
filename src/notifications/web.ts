import { formatDose } from '@/constants/catalog';
import { listDosesBetween } from '@/db/queries/doses';
import { getSchedule } from '@/db/queries/schedules';
import { getSupplement } from '@/db/queries/supplements';
import { ensureUpcomingDoses } from '@/domain/doses';
import { addLocalDays, endOfLocalDay, startOfLocalDay } from '@/domain/time';
import { VAPID_PUBLIC_KEY } from '@/notifications/vapid';

const DEVICE_KEY = 'pillio.deviceId';
const NTFY_KEY = 'pillio.ntfyTopic';
let syncHookStarted = false;

export type WebReminderStatus = 'unsupported' | 'needs-install' | 'denied' | 'granted' | 'off';

function deviceId() {
  let id = window.localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

export function getNtfyTopic() {
  if (typeof window === 'undefined') return '';
  let topic = window.localStorage.getItem(NTFY_KEY);
  if (!topic) {
    const raw = deviceId().replace(/-/g, '').slice(0, 18);
    topic = `pillio${raw}`;
    window.localStorage.setItem(NTFY_KEY, topic);
  }
  return topic;
}

export function ntfySubscribeUrl() {
  return `https://ntfy.sh/${getNtfyTopic()}`;
}

export function isStandaloneWebApp() {
  if (typeof window === 'undefined') return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
}

export function webPushSupported() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export async function getWebReminderStatus(): Promise<WebReminderStatus> {
  if (!webPushSupported()) return 'unsupported';
  if (!isStandaloneWebApp() && isLikelyIos()) return 'needs-install';
  if (Notification.permission === 'denied') return 'denied';
  if (Notification.permission === 'granted') {
    const sub = await getExistingSubscription();
    return sub ? 'granted' : 'off';
  }
  return 'off';
}

function isLikelyIos() {
  return /iPad|iPhone|iPod/.test(window.navigator.userAgent);
}

async function getExistingSubscription() {
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

export async function registerWebServiceWorker() {
  if (!webPushSupported()) return;
  await navigator.serviceWorker.register('/sw.js');
}

function vapidKey() {
  const padding = '='.repeat((4 - (VAPID_PUBLIC_KEY.length % 4)) % 4);
  const base64 = (VAPID_PUBLIC_KEY + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

export async function enableWebReminders(): Promise<boolean> {
  getNtfyTopic();
  if (webPushSupported()) {
    try {
      await registerWebServiceWorker();
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const registration = await navigator.serviceWorker.ready;
        let subscription = await registration.pushManager.getSubscription();
        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: vapidKey(),
          });
        }
      }
    } catch {
      // iOS PWA push is optional; ntfy is the lock-screen channel
    }
  }
  await syncWebReminders({ test: true });
  startReminderWatchdog();
  return true;
}

function upcomingDoses() {
  ensureUpcomingDoses();
  const now = Date.now();
  const from = startOfLocalDay(now);
  const to = endOfLocalDay(addLocalDays(from, 7));
  const open = listDosesBetween(from, to).filter((dose) => !dose.takenAt && !dose.skipped);
  const doses: { id: string; at: number; title: string; body: string }[] = [];

  for (const dose of open) {
    if (!dose.scheduleId) continue;
    const schedule = getSchedule(dose.scheduleId);
    if (!schedule?.reminderEnabled || !schedule.active) continue;
    const supplement = getSupplement(dose.supplementId);
    if (!supplement || supplement.archived) continue;
    doses.push({
      id: dose.id,
      at: dose.scheduledFor,
      title: supplement.name,
      body: `${formatDose(dose.amount, dose.unit)} is still unchecked.`,
    });
  }
  return doses;
}

function remindersEndpoint() {
  if (typeof window === 'undefined') return null;
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') return null;
  return '/.netlify/functions/reminders';
}

export async function syncWebReminders(options: { test?: boolean } = {}) {
  if (typeof window === 'undefined') return;
  try {
    let subscription = null;
    if (webPushSupported()) {
      try {
        await registerWebServiceWorker();
        const sub = await getExistingSubscription();
        subscription = sub ? sub.toJSON() : null;
      } catch {
        subscription = null;
      }
    }
    const endpoint = remindersEndpoint();
    if (!endpoint) return;
    const doses = upcomingDoses();
    await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceId: deviceId(),
        ntfyTopic: getNtfyTopic(),
        subscription,
        doses,
        test: Boolean(options.test),
      }),
    });
    startReminderWatchdog();
  } catch {
    // offline or function not deployed yet
  }
}

export function startReminderWatchdog() {
  if (syncHookStarted || typeof window === 'undefined') return;
  syncHookStarted = true;
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      void syncWebReminders();
    }
  });
}
