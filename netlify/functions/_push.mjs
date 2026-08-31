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

export async function sendPush(subscription, dose) {
  await webpush.sendNotification(subscription, pushPayload(dose), {
    TTL: 60 * 60,
    urgency: 'high',
  });
}
