// Nexa client service worker: shows a notification when a web push arrives.
self.addEventListener('push', (event) => {
  let data = { title: 'Nexa', body: '' };
  try {
    if (event.data) data = event.data.json();
  } catch {
    // keep defaults
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'Nexa', {
      body: data.body || '',
      tag: 'nexa-status',
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow('/'));
});
