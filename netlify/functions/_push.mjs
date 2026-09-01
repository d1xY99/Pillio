import webpush from 'web-push';

const VAPID_PUBLIC =
  'BDIeR0nsom-ayGildXnmR7ySYlTDNXwh-BJcxCAmKQ1B_txQoY4YI1_vsWcO5qEGy1fIqGGa5iFMzmi98dUqAbM';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || 'lUKbFuBjIHOhlNLaYezsA59f5vRTNbMMvRQrJKWvDuI';

webpush.setVapidDetails('mailto:pillio@local', VAPID_PUBLIC, VAPID_PRIVATE);

export const REPEAT_MS = 15 * 60 * 1000;

export function shouldAlert(dose, now = Date.now()) {
  if (!dose?.at || dose.at > now) return false;
  if (dose.lastSent && now - Number(dose.lastSent) < REPEAT_MS) return false;
  return true;
}

export function pushPayload(dose) {
  const title = dose.title || 'Pillio';
  const body = dose.body || 'A dose or habit is still open.';
  return JSON.stringify({
    web_push: 8030,
    notification: {
      title,
      body,
      navigate: 'https://pillioo.netlify.app/',
      silent: false,
    },
    title,
    body,
    doseId: dose.id,
  });
}

export async function sendPush(subscription, dose, ntfyTopic) {
  const title = dose.title || 'Pillio';
  const body = dose.body || 'A dose or habit is still open.';
  const jobs = [];

  if (subscription?.endpoint) {
    jobs.push(
      webpush
        .sendNotification(subscription, pushPayload(dose), {
          TTL: 60 * 60,
          urgency: 'high',
        })
        .catch(() => {}),
    );
  }

  if (ntfyTopic && /^[a-zA-Z0-9_-]{8,64}$/.test(ntfyTopic)) {
    jobs.push(
      fetch(`https://ntfy.sh/${ntfyTopic}`, {
        method: 'POST',
        headers: {
          Title: title,
          Priority: 'urgent',
          Tags: 'warning,pill',
          Click: 'https://pillioo.netlify.app/',
        },
        body,
      }).then((res) => {
        if (!res.ok) throw new Error(`ntfy ${res.status}`);
      }),
    );
  }

  if (jobs.length === 0) {
    throw new Error('No delivery channel');
  }
  await Promise.all(jobs);
}
