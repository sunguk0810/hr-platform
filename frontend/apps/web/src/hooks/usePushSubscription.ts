import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/apiClient';

// VAPID public key - in production, this should come from environment/config
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

export type PushSubscriptionStatus =
  | 'unsupported'
  | 'loading'
  | 'unsubscribed'
  | 'subscribed'
  | 'denied';

interface UsePushSubscriptionReturn {
  status: PushSubscriptionStatus;
  isSupported: boolean;
  isSubscribed: boolean;
  isLoading: boolean;
  error: Error | null;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  registration: ServiceWorkerRegistration | null;
}

/**
 * Convert base64 URL-safe string to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Hook for managing Web Push subscription
 */
export function usePushSubscription(): UsePushSubscriptionReturn {
  const [status, setStatus] = useState<PushSubscriptionStatus>('loading');
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const isSupported = typeof window !== 'undefined'
    && 'serviceWorker' in navigator
    && 'PushManager' in window
    && 'Notification' in window;

  const isSubscribed = status === 'subscribed';
  const isLoading = status === 'loading';

  // Initialize service worker and check subscription status
  useEffect(() => {
    if (!isSupported) {
      setStatus('unsupported');
      return;
    }

    // Check if notification permission is denied
    if (Notification.permission === 'denied') {
      setStatus('denied');
      return;
    }

    // Register service worker and check subscription
    const initServiceWorker = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/push-sw.js', {
          scope: '/',
        });
        setRegistration(reg);

        // Wait for service worker to be ready
        await navigator.serviceWorker.ready;

        // Check existing subscription
        const subscription = await reg.pushManager.getSubscription();
        setStatus(subscription ? 'subscribed' : 'unsubscribed');
      } catch (err) {
        console.error('[Push] Service worker registration failed:', err);
        setError(err instanceof Error ? err : new Error('Service worker registration failed'));
        setStatus('unsupported');
      }
    };

    initServiceWorker();
  }, [isSupported]);

  // Listen for notification click messages from service worker
  useEffect(() => {
    if (!isSupported) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'NOTIFICATION_CLICK') {
        const { url } = event.data;
        if (url) {
          // Navigate to the notification URL
          window.location.href = url;
        }
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, [isSupported]);

  /**
   * Subscribe to push notifications
   */
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !registration) {
      console.warn('[Push] Push notifications not supported');
      return false;
    }

    if (Notification.permission === 'denied') {
      setStatus('denied');
      return false;
    }

    try {
      setStatus('loading');
      setError(null);

      // Request notification permission if not granted
      if (Notification.permission !== 'granted') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          setStatus('denied');
          return false;
        }
      }

      // Subscribe to push manager
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: VAPID_PUBLIC_KEY
          ? urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
          : undefined,
      });

      // Send subscription to server
      await apiClient.post('/notifications/push/subscribe', {
        subscription: subscription.toJSON(),
        userAgent: navigator.userAgent,
      });

      setStatus('subscribed');
      return true;
    } catch (err) {
      console.error('[Push] Subscription failed:', err);
      setError(err instanceof Error ? err : new Error('Push subscription failed'));
      setStatus('unsubscribed');
      return false;
    }
  }, [isSupported, registration]);

  /**
   * Unsubscribe from push notifications
   */
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !registration) {
      return false;
    }

    try {
      setStatus('loading');
      setError(null);

      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        // Notify server before unsubscribing
        try {
          await apiClient.post('/notifications/push/unsubscribe', {
            endpoint: subscription.endpoint,
          });
        } catch {
          // Continue with unsubscribe even if server notification fails
          console.warn('[Push] Failed to notify server of unsubscribe');
        }

        await subscription.unsubscribe();
      }

      setStatus('unsubscribed');
      return true;
    } catch (err) {
      console.error('[Push] Unsubscribe failed:', err);
      setError(err instanceof Error ? err : new Error('Push unsubscribe failed'));
      // Still mark as unsubscribed since the subscription might be invalid
      setStatus('unsubscribed');
      return false;
    }
  }, [isSupported, registration]);

  return {
    status,
    isSupported,
    isSubscribed,
    isLoading,
    error,
    subscribe,
    unsubscribe,
    registration,
  };
}

export default usePushSubscription;
