import { useState, useEffect, useCallback } from 'react';

type NotificationPermissionState = NotificationPermission | 'unsupported';

interface UseNotificationPermissionReturn {
  permission: NotificationPermissionState;
  isSupported: boolean;
  isGranted: boolean;
  isDenied: boolean;
  requestPermission: () => Promise<NotificationPermission | null>;
  showNotification: (title: string, options?: NotificationOptions) => Notification | null;
}

/**
 * Hook for managing browser notification permissions
 */
export function useNotificationPermission(): UseNotificationPermissionReturn {
  const [permission, setPermission] = useState<NotificationPermissionState>(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission;
  });

  const isSupported = typeof window !== 'undefined' && 'Notification' in window;
  const isGranted = permission === 'granted';
  const isDenied = permission === 'denied';

  // Listen for permission changes
  useEffect(() => {
    if (!isSupported) return;

    // Some browsers support permission change events
    const handlePermissionChange = () => {
      setPermission(Notification.permission);
    };

    // Check if permissions API is available
    if ('permissions' in navigator) {
      navigator.permissions
        .query({ name: 'notifications' })
        .then((permissionStatus) => {
          permissionStatus.addEventListener('change', handlePermissionChange);
        })
        .catch(() => {
          // Permissions API not fully supported
        });
    }

    return () => {
      if ('permissions' in navigator) {
        navigator.permissions
          .query({ name: 'notifications' })
          .then((permissionStatus) => {
            permissionStatus.removeEventListener('change', handlePermissionChange);
          })
          .catch(() => {
            // Ignore cleanup errors
          });
      }
    };
  }, [isSupported]);

  const requestPermission = useCallback(async (): Promise<NotificationPermission | null> => {
    if (!isSupported) {
      console.warn('Browser notifications are not supported');
      return null;
    }

    if (permission === 'granted') {
      return 'granted';
    }

    if (permission === 'denied') {
      console.warn('Notification permission was previously denied');
      return 'denied';
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return null;
    }
  }, [isSupported, permission]);

  const showNotification = useCallback(
    (title: string, options?: NotificationOptions): Notification | null => {
      if (!isSupported) {
        console.warn('Browser notifications are not supported');
        return null;
      }

      if (!isGranted) {
        console.warn('Notification permission not granted');
        return null;
      }

      try {
        const notification = new Notification(title, {
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          ...options,
        });

        return notification;
      } catch (error) {
        console.error('Error showing notification:', error);
        return null;
      }
    },
    [isSupported, isGranted]
  );

  return {
    permission,
    isSupported,
    isGranted,
    isDenied,
    requestPermission,
    showNotification,
  };
}

export default useNotificationPermission;
