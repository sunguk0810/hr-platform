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

// Backend returns Long directly, not wrapped in object
export type UnreadCountResponse = number;

export const notificationService = {
  /**
   * 알림 목록 조회 - Backend uses /notifications/my
   */
  async getNotifications(
    params?: NotificationSearchParams
  ): Promise<ApiResponse<PageResponse<Notification>>> {
    const response = await apiClient.get<ApiResponse<PageResponse<Notification>>>(
      '/notifications/my',
      { params }
    );
    return response.data;
  },

  /**
   * 단일 알림 조회 - TODO: Backend needs to implement this endpoint
   */
  async getNotification(id: string): Promise<ApiResponse<Notification>> {
    const response = await apiClient.get<ApiResponse<Notification>>(`/notifications/${id}`);
    return response.data;
  },

  /**
   * 알림 읽음 처리 - Backend uses POST (not PATCH)
   */
  async markAsRead(id: string): Promise<ApiResponse<null>> {
    const response = await apiClient.post<ApiResponse<null>>(
      `/notifications/${id}/read`
    );
    return response.data;
  },

  /**
   * 전체 알림 읽음 처리 - Backend uses POST /notifications/my/read-all
   */
  async markAllAsRead(): Promise<ApiResponse<null>> {
    const response = await apiClient.post<ApiResponse<null>>('/notifications/my/read-all');
    return response.data;
  },

  /**
   * 알림 삭제 - TODO: Backend needs to implement this endpoint
   */
  async deleteNotification(id: string): Promise<ApiResponse<null>> {
    const response = await apiClient.delete<ApiResponse<null>>(`/notifications/${id}`);
    return response.data;
  },

  /**
   * 여러 알림 삭제 - TODO: Backend needs to implement this endpoint
   */
  async deleteNotifications(ids: string[]): Promise<ApiResponse<{ deleted: number }>> {
    const response = await apiClient.post<ApiResponse<{ deleted: number }>>(
      '/notifications/bulk-delete',
      { ids }
    );
    return response.data;
  },

  /**
   * 알림 설정 조회 - TODO: Backend needs to implement this endpoint
   */
  async getSettings(): Promise<ApiResponse<NotificationSettings>> {
    const response = await apiClient.get<ApiResponse<NotificationSettings>>(
      '/notifications/settings'
    );
    return response.data;
  },

  /**
   * 알림 설정 수정 - TODO: Backend needs to implement this endpoint
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
   * 읽지 않은 알림 개수 조회 - Backend uses /notifications/my/unread/count
   */
  async getUnreadCount(): Promise<ApiResponse<UnreadCountResponse>> {
    const response = await apiClient.get<ApiResponse<UnreadCountResponse>>(
      '/notifications/my/unread/count'
    );
    return response.data;
  },
};

export default notificationService;
