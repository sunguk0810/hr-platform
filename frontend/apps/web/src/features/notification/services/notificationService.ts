import { apiClient, ApiResponse, PageResponse } from '@/lib/apiClient';

// Types
export type NotificationType = 'APPROVAL' | 'ATTENDANCE' | 'SYSTEM' | 'ANNOUNCEMENT' | 'LEAVE';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface NotificationSettings {
  emailEnabled: boolean;
  pushEnabled: boolean;
  browserEnabled: boolean;
  smsEnabled: boolean;
  approvalNotifications: boolean;
  leaveNotifications: boolean;
  announcementNotifications: boolean;
  reminderNotifications: boolean;
  systemNotifications: boolean;
  digestEnabled: boolean;
  quietHoursEnabled: boolean;
}

export interface NotificationSearchParams {
  page?: number;
  size?: number;
  type?: NotificationType;
  unreadOnly?: boolean;
}

export interface UnreadCountResponse {
  count: number;
}

export const notificationService = {
  /**
   * 알림 목록 조회
   */
  async getNotifications(
    params?: NotificationSearchParams
  ): Promise<ApiResponse<PageResponse<Notification>>> {
    const response = await apiClient.get<ApiResponse<PageResponse<Notification>>>(
      '/notifications',
      { params }
    );
    return response.data;
  },

  /**
   * 단일 알림 조회
   */
  async getNotification(id: string): Promise<ApiResponse<Notification>> {
    const response = await apiClient.get<ApiResponse<Notification>>(`/notifications/${id}`);
    return response.data;
  },

  /**
   * 알림 읽음 처리
   */
  async markAsRead(id: string): Promise<ApiResponse<Notification>> {
    const response = await apiClient.patch<ApiResponse<Notification>>(
      `/notifications/${id}/read`
    );
    return response.data;
  },

  /**
   * 전체 알림 읽음 처리
   */
  async markAllAsRead(): Promise<ApiResponse<null>> {
    const response = await apiClient.patch<ApiResponse<null>>('/notifications/read-all');
    return response.data;
  },

  /**
   * 알림 삭제
   */
  async deleteNotification(id: string): Promise<ApiResponse<null>> {
    const response = await apiClient.delete<ApiResponse<null>>(`/notifications/${id}`);
    return response.data;
  },

  /**
   * 여러 알림 삭제
   */
  async deleteNotifications(ids: string[]): Promise<ApiResponse<{ deleted: number }>> {
    const response = await apiClient.post<ApiResponse<{ deleted: number }>>(
      '/notifications/bulk-delete',
      { ids }
    );
    return response.data;
  },

  /**
   * 알림 설정 조회
   */
  async getSettings(): Promise<ApiResponse<NotificationSettings>> {
    const response = await apiClient.get<ApiResponse<NotificationSettings>>(
      '/notifications/settings'
    );
    return response.data;
  },

  /**
   * 알림 설정 수정
   */
  async updateSettings(
    settings: Partial<NotificationSettings>
  ): Promise<ApiResponse<NotificationSettings>> {
    const response = await apiClient.put<ApiResponse<NotificationSettings>>(
      '/notifications/settings',
      settings
    );
    return response.data;
  },

  /**
   * 읽지 않은 알림 개수 조회
   */
  async getUnreadCount(): Promise<ApiResponse<UnreadCountResponse>> {
    const response = await apiClient.get<ApiResponse<UnreadCountResponse>>(
      '/notifications/unread-count'
    );
    return response.data;
  },
};

export default notificationService;
