import { useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryClient';
import { wsClient, type NotificationEvent } from '@/lib/websocket';
import { useNotificationStore } from '@/stores/notificationStore';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from './useToast';

export interface UseRealTimeNotificationOptions {
  enabled?: boolean;
  showToast?: boolean;
}

export function useRealTimeNotification(
  options: UseRealTimeNotificationOptions = {}
) {
  const { enabled = true, showToast = true } = options;
  const { isAuthenticated } = useAuthStore();
  const {
    addNotification,
    setUnreadCount,
    incrementUnreadCount,
    markAsRead,
  } = useNotificationStore();
  const { toast } = useToast();

  const handleNewNotification = useCallback(
    (notification: NotificationEvent) => {
      addNotification({
        id: notification.id,
        notificationType: notification.type,
        title: notification.title,
        content: notification.message,
        isRead: false,
        createdAt: notification.createdAt,
        data: notification.data,
      });

      incrementUnreadCount();

      if (showToast) {
        toast({
          title: notification.title,
          description: notification.message,
        });
      }
    },
    [addNotification, incrementUnreadCount, showToast, toast]
  );

  const handleNotificationRead = useCallback(
    (notificationId: string) => {
      markAsRead(notificationId);
    },
    [markAsRead]
  );

  const handleNotificationCount = useCallback(
    (count: number) => {
      setUnreadCount(count);
    },
    [setUnreadCount]
  );

  useEffect(() => {
    if (!enabled || !isAuthenticated) {
      return;
    }

    wsClient.connect();

    const unsubscribeNew = wsClient.on('notification:new', handleNewNotification);
    const unsubscribeRead = wsClient.on('notification:read', handleNotificationRead);
    const unsubscribeCount = wsClient.on('notification:count', handleNotificationCount);

    return () => {
      unsubscribeNew();
      unsubscribeRead();
      unsubscribeCount();
    };
  }, [
    enabled,
    isAuthenticated,
    handleNewNotification,
    handleNotificationRead,
    handleNotificationCount,
  ]);

  return {
    isConnected: wsClient.isConnected(),
  };
}

export function useApprovalRealTime() {
  const { t } = useTranslation('approval');
  const { toast } = useToast();
  const { isAuthenticated } = useAuthStore();

  const handleStatusChanged = useCallback(
    (event: { title: string; status: string; approverName: string }) => {
      const statusText =
        event.status === 'APPROVED'
          ? t('realTime.statusApproved')
          : event.status === 'REJECTED'
            ? t('realTime.statusRejected')
            : event.status;

      toast({
        title: t('realTime.statusChanged', { status: statusText }),
        description: t('realTime.statusChangedDesc', {
          title: event.title,
          approverName: event.approverName,
          status: statusText,
        }),
      });
    },
    [toast, t]
  );

  const handleNewRequest = useCallback(
    (event: { title: string; requesterName: string }) => {
      toast({
        title: t('realTime.newRequest'),
        description: t('realTime.newRequestDesc', {
          requesterName: event.requesterName,
          title: event.title,
        }),
      });
    },
    [toast, t]
  );

  useEffect(() => {
    if (!isAuthenticated) return;

    const unsubscribeStatus = wsClient.on(
      'approval:status_changed',
      handleStatusChanged
    );
    const unsubscribeRequest = wsClient.on(
      'approval:new_request',
      handleNewRequest
    );

    return () => {
      unsubscribeStatus();
      unsubscribeRequest();
    };
  }, [isAuthenticated, handleStatusChanged, handleNewRequest]);
}

export function useAttendanceRealTime() {
  const { t } = useTranslation('attendance');
  const { toast } = useToast();
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  const handleCheckIn = useCallback(
    (_event: unknown) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.attendance.today() });
      queryClient.invalidateQueries({ queryKey: queryKeys.attendance.list() });

      toast({
        title: t('checkIn.checkIn'),
        description: t('checkIn.checkInComplete'),
      });
    },
    [queryClient, t, toast]
  );

  const handleCheckOut = useCallback(
    (_event: unknown) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.attendance.today() });
      queryClient.invalidateQueries({ queryKey: queryKeys.attendance.list() });

      toast({
        title: t('checkIn.checkOut'),
        description: t('checkIn.checkOutComplete'),
      });
    },
    [queryClient, t, toast]
  );

  useEffect(() => {
    if (!isAuthenticated) return;

    const unsubscribeCheckIn = wsClient.on(
      'attendance:checked_in',
      handleCheckIn
    );
    const unsubscribeCheckOut = wsClient.on(
      'attendance:checked_out',
      handleCheckOut
    );

    return () => {
      unsubscribeCheckIn();
      unsubscribeCheckOut();
    };
  }, [isAuthenticated, handleCheckIn, handleCheckOut]);
}
