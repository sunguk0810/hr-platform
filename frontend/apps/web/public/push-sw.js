/**
 * Push Notification Service Worker
 * Handles push messages and notification clicks
 */

// Cache version - update when making changes
const CACHE_VERSION = 'v1';

// Handle push notifications
self.addEventListener('push', function (event) {
  console.log('[Push SW] Push notification received:', event);

  let data = {
    title: 'HR SaaS',
    body: '새로운 알림이 있습니다',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'default',
    data: {
      url: '/notifications',
    },
  };

  // Parse push data if available
  if (event.data) {
    try {
      const payload = event.data.json();
      data = {
        title: payload.title || data.title,
        body: payload.body || payload.message || data.body,
        icon: payload.icon || data.icon,
        badge: payload.badge || data.badge,
        tag: payload.tag || payload.id || data.tag,
        data: {
          url: payload.link || payload.url || data.data.url,
          id: payload.id,
          type: payload.type,
        },
      };
    } catch (e) {
      // If not JSON, use text
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    data: data.data,
    vibrate: [100, 50, 100],
    requireInteraction: true,
    actions: [
      {
        action: 'open',
        title: '확인',
      },
      {
        action: 'close',
        title: '닫기',
      },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Handle notification click
self.addEventListener('notificationclick', function (event) {
  console.log('[Push SW] Notification click received:', event);

  event.notification.close();

  // Handle action button clicks
  if (event.action === 'close') {
    return;
  }

  // Get the URL to open
  const urlToOpen = event.notification.data?.url || '/notifications';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      // If a window is already open, focus it
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          // Navigate to the notification URL
          client.postMessage({
            type: 'NOTIFICATION_CLICK',
            url: urlToOpen,
            notificationId: event.notification.data?.id,
          });
          return;
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Handle notification close
self.addEventListener('notificationclose', function (event) {
  console.log('[Push SW] Notification closed:', event);

  // Could track notification dismissal analytics here
  if (event.notification.data?.id) {
    // Send analytics event
    fetch('/api/v1/notifications/analytics/dismissed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationId: event.notification.data.id }),
    }).catch(() => {
      // Ignore analytics errors
    });
  }
});

// Handle push subscription change
self.addEventListener('pushsubscriptionchange', function (event) {
  console.log('[Push SW] Push subscription changed:', event);

  event.waitUntil(
    self.registration.pushManager
      .subscribe({
        userVisibleOnly: true,
        applicationServerKey: event.oldSubscription?.options?.applicationServerKey,
      })
      .then(function (subscription) {
        // Send new subscription to server
        return fetch('/api/v1/notifications/push/resubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            oldEndpoint: event.oldSubscription?.endpoint,
            newSubscription: subscription.toJSON(),
          }),
        });
      })
  );
});

// Service worker activation
self.addEventListener('activate', function (event) {
  console.log('[Push SW] Service worker activated');

  // Claim all clients immediately
  event.waitUntil(self.clients.claim());
});

// Service worker installation
self.addEventListener('install', function (event) {
  console.log('[Push SW] Service worker installed');

  // Skip waiting to activate immediately
  self.skipWaiting();
});
