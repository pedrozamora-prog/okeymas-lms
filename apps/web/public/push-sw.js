// Service Worker para Web Push Notifications — Formia LMS
// Se registra INDEPENDIENTEMENTE del SW de PWA/Workbox

self.addEventListener("push", function (event) {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Formia", body: event.data.text() };
  }

  const title   = payload.title ?? "Formia";
  const options = {
    body:    payload.body   ?? "",
    icon:    payload.icon   ?? "/logo-icon.png",
    badge:   payload.badge  ?? "/logo-icon.png",
    tag:     payload.tag    ?? "formia-notification",
    data:    { url: payload.url ?? "/dashboard" },
    actions: payload.actions ?? [],
    vibrate: [200, 100, 200],
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const url = event.notification.data?.url ?? "/dashboard";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
