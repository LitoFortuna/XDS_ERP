// Manejadores de notificaciones push. vite-plugin-pwa (generateSW) los incluye en el service worker
// de producción con `workbox.importScripts` (ver vite.config.ts). Sin esto el service worker
// generado no tiene ningún listener 'push' y los avisos solo se ven con la app abierta.

self.addEventListener('push', (event) => {
    let data = {};
    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data = { title: 'Xen Dance Space', body: event.data.text() };
        }
    }

    const title = data.title || 'Xen Dance Space';
    // El servidor envía la URL anidada en `data.url` (functions/src/index.ts).
    const url = (data.data && data.data.url) || data.url || '/';

    const options = {
        body: data.body || '',
        icon: data.icon || '/pwa-192x192.png',
        badge: data.badge || '/pwa-192x192.png',
        vibrate: [100, 50, 100],
        data: { url },
    };

    event.waitUntil((async () => {
        await self.registration.showNotification(title, options);
        if (self.navigator && 'setAppBadge' in self.navigator) {
            try { await self.navigator.setAppBadge(data.badgeCount || 1); } catch (e) { /* no soportado */ }
        }
    })());
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const target = new URL((event.notification.data && event.notification.data.url) || '/', self.location.origin).href;

    event.waitUntil((async () => {
        if (self.navigator && 'clearAppBadge' in self.navigator) {
            try { await self.navigator.clearAppBadge(); } catch (e) { /* no soportado */ }
        }
        const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        for (const client of windows) {
            if (new URL(client.url).origin === self.location.origin && 'focus' in client) {
                await client.focus();
                if ('navigate' in client && client.url !== target) {
                    try { await client.navigate(target); } catch (e) { /* cross-origin o no soportado */ }
                }
                return;
            }
        }
        if (self.clients.openWindow) await self.clients.openWindow(target);
    })());
});
