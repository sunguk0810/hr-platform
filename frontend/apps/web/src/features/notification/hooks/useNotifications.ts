import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService, NotificationSearchParams } from '../services/notificationService';
import { useNotificationStore } from '@/stores/notificationStore';
import { useEffect } from 'react';

const QUERY_KEYS = {
  notifications: 'notifications',
  unreadCount: 'notification-unread-count',
} as const;

/**
 * 알림 목록 조회 hook
 */
export function useNotifications(params?: NotificationSearchParams) {
  const setNotifications = useNotificationStore((state) => state.setNotifications);

  const query = useQuery({
    queryKey: [QUERY_KEYS.notifications, params],
    queryFn: () => notificationService.getNotifications(params),
    staleTime: 1000 * 60, // 1분
  });

  // Sync with store when data changes
  useEffect(() => {
    if (query.data?.data?.content) {
      setNotifications(query.data.data.content);
    }
  }, [query.data, setNotifications]);

  return query;
}

/**
 * 읽지 않은 알림 개수 조회 hook
 */
export function useUnreadCount() {
  const setUnreadCount = useNotificationStore((state) => state.setUnreadCount);

  const query = useQuery({
    queryKey: [QUERY_KEYS.unreadCount],
    queryFn: () => notificationService.getUnreadCount(),
    staleTime: 1000 * 30, // 30초
    refetchInterval: 1000 * 60, // 1분마다 자동 갱신
  });

  // Sync with store when data changes
  useEffect(() => {
    if (query.data?.data !== undefined) {
      setUnreadCount(query.data.data);
    }
  }, [query.data, setUnreadCount]);

  return query;
}

/**
 * 알림 읽음 처리 mutation
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient();
  const markAsRead = useNotificationStore((state) => state.markAsRead);

  return useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onMutate: (id) => {
      // Optimistic update
      markAsRead(id);
    },
    onSuccess: () => {
      // Invalidate queries to sync with server
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.notifications] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.unreadCount] });
    },
  });
}

/**
 * 전체 알림 읽음 처리 mutation
 */
export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  const markAllAsRead = useNotificationStore((state) => state.markAllAsRead);

  return useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onMutate: () => {
      // Optimistic update
      markAllAsRead();
    },
    onSuccess: () => {
      // Invalidate queries to sync with server
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.notifications] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.unreadCount] });
    },
  });
}

/**
 * 알림 삭제 mutation
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient();
  const removeNotification = useNotificationStore((state) => state.removeNotification);

  return useMutation({
    mutationFn: (id: string) => notificationService.deleteNotification(id),
    onMutate: (id) => {
      // Optimistic update
      removeNotification(id);
    },
    onSuccess: () => {
      // Invalidate queries to sync with server
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.notifications] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.unreadCount] });
    },
  });
}

/**
 * 알림 새로고침 helper
 */
export function useRefreshNotifications() {
  const queryClient = useQueryClient();

  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.notifications] }),
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.unreadCount] }),
    ]);
  };
}
