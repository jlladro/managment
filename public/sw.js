self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : { title: 'Neuigkeit', body: 'Es gibt etwas Neues im System!' };
  
  const options = {
    body: data.body,
    icon: '/pwa-icon-512.png',
    badge: '/pwa-icon-192.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
