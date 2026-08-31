import webpush from 'web-push';

const VAPID_PUBLIC =
  'BDIeR0nsom-ayGildXnmR7ySYlTDNXwh-BJcxCAmKQ1B_txQoY4YI1_vsWcO5qEGy1fIqGGa5iFMzmi98dUqAbM';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || 'lUKbFuBjIHOhlNLaYezsA59f5vRTNbMMvRQrJKWvDuI';

webpush.setVapidDetails('mailto:pillio@local', VAPID_PUBLIC, VAPID_PRIVATE);

export function pushPayload(dose) {
  const title = dose.title || 'Pillio';
  const body = dose.body || 'A dose is still unchecked.';
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
  const body = dose.body || 'A dose is still unchecked.';
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
          Priority: 'high',
          Tags: 'pill,alarm_clock',
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
