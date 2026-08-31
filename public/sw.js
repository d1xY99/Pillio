self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  event.waitUntil(showFromPush(event));
});

async function showFromPush(event) {
  let title = 'Pillio';
  let body = 'A dose is still unchecked.';
  let data = {};
  try {
    if (event.data) {
      data = event.data.json();
      const note = data.notification || data;
      title = note.title || data.title || title;
      body = note.body || data.body || body;
    }
  } catch {
    try {
      body = event.data ? event.data.text() : body;
    } catch {
      // keep defaults
    }
  }

  await self.registration.showNotification(title, {
    body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: data.doseId || title,
    renotify: true,
    data,
  });
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = 'https://pillioo.netlify.app/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      return self.clients.openWindow(target);
    }),
  );
});

self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(self.registration.pushManager.subscribe({ userVisibleOnly: true }));
});
