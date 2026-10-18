// Manejadores de notificaciones push. vite-plugin-pwa (generateSW) los incluye en el service worker
// de producción con `workbox.importScripts` (ver vite.config.ts). Sin esto el service worker
// generado no tiene ningún listener 'push' y los avisos solo se ven con la app abierta.

// La insignia del icono (el número rojo) refleja lo que realmente hay en la bandeja: se recalcula al
// llegar un aviso, al pulsarlo y al descartarlo. Antes siempre se ponía "1" y solo se borraba al
// pulsar una notificación.
async function syncBadge() {
    if (!(self.navigator && 'setAppBadge' in self.navigator)) return;
    try {
        const count = (await self.registration.getNotifications()).length;
        if (count > 0) await self.navigator.setAppBadge(count);
        else await self.navigator.clearAppBadge();
    } catch (e) { /* no soportado */ }
}

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
    // Con `tag` un aviso nuevo SUSTITUYE al anterior con la misma etiqueta (en vez de apilarse), y
    // renotify hace que vuelva a sonar/vibrar. Así una ráfaga de actividad no llena la bandeja.
    if (data.tag) {
        options.tag = data.tag;
        options.renotify = true;
    }

    event.waitUntil((async () => {
        await self.registration.showNotification(title, options);
        await syncBadge();
    })());
});

// Descartar un aviso (deslizarlo) también actualiza la insignia.
self.addEventListener('notificationclose', (event) => {
    event.waitUntil(syncBadge());
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const target = new URL((event.notification.data && event.notification.data.url) || '/', self.location.origin).href;

    event.waitUntil((async () => {
        await syncBadge();
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
