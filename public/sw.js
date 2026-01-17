
// Service Worker for XDS ERP
const CACHE_NAME = 'xds-erp-v1';

self.addEventListener('install', (event) => {
    console.log('[SW] Install event');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('[SW] Activate event');
    event.waitUntil(clients.claim());
});

// Handle Push Notifications
self.addEventListener('push', (event) => {
    if (!event.data) return;

    const data = event.data.json();
    const options = {
        body: data.body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        vibrate: [100, 50, 100],
        data: {
            url: data.url || '/'
        }
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );

    // Update App Badge if supported
    if ('setAppBadge' in navigator) {
        // We increment the badge count. This is simplified; 
        // in a real world, you'd fetch the actual count from your API.
        navigator.setAppBadge(data.badgeCount || 1);
    }
});

// Handle Notification Clicks
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((clientList) => {
            // If a window is already open, focus it
            for (const client of clientList) {
                if (client.url === '/' && 'focus' in client) {
                    return client.focus();
                }
            }
            // If no window is open, open a new one
            if (clients.openWindow) {
                return clients.openWindow(event.notification.data.url);
            }
        })
    );

    // Clear badge when opened
    if ('clearAppBadge' in navigator) {
        navigator.clearAppBadge();
    }
});
