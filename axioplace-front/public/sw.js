// Service Worker Axioplace — Notifications Push
const CACHE_NAME = 'axioplace-v1';

// Écouter les Push Events
self.addEventListener('push', event => {
    if (!event.data) return;

    let data = {};
    try { data = event.data.json(); } catch { data = { titre: 'Axioplace', corps: event.data.text() }; }

    const title   = data.titre || 'Axioplace';
    const options = {
        body:    data.corps || '',
        icon:    '/logo192.png',
        badge:   '/badge72.png',
        tag:     data.type || 'general',
        renotify: true,
        vibrate: [200, 100, 200],
        data: {
            url:  data.url || '/',
            type: data.type || 'info',
        },
        actions: [
            { action: 'open', title: 'Voir' },
            { action: 'close', title: 'Ignorer' },
        ],
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// Clic sur la notification
self.addEventListener('notificationclick', event => {
    event.notification.close();

    if (event.action === 'close') return;

    const url = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
            // Si un onglet Axioplace est déjà ouvert, le focus
            for (const client of windowClients) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    client.navigate(url);
                    return client.focus();
                }
            }
            // Sinon, ouvrir un nouvel onglet
            if (clients.openWindow) return clients.openWindow(url);
        })
    );
});

// Installation du SW
self.addEventListener('install', event => {
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(clients.claim());
});
