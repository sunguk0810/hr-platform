import { describe, it, expect, vi, beforeEach } from 'vitest';
import { notificationService } from '../notificationService';
import { apiClient } from '@/lib/apiClient';

// Mock apiClient
vi.mock('@/lib/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('notificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getNotifications', () => {
    it('should fetch notifications list without params', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            content: [
              {
                id: '1',
                type: 'APPROVAL',
                title: 'Test Notification',
                message: 'Test message',
                isRead: false,
                createdAt: '2024-01-01T00:00:00Z',
              },
            ],
            page: 0,
            size: 10,
            totalElements: 1,
            totalPages: 1,
            first: true,
            last: true,
          },
          timestamp: '2024-01-01T00:00:00Z',
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await notificationService.getNotifications();

      expect(apiClient.get).toHaveBeenCalledWith('/notifications', { params: undefined });
      expect(result.success).toBe(true);
      expect(result.data.content).toHaveLength(1);
    });

    it('should fetch notifications with params', async () => {
      const params = { page: 0, size: 20, type: 'APPROVAL' as const, unreadOnly: true };
      const mockResponse = {
        data: {
          success: true,
          data: { content: [], page: 0, size: 20, totalElements: 0, totalPages: 0, first: true, last: true },
          timestamp: '2024-01-01T00:00:00Z',
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      await notificationService.getNotifications(params);

      expect(apiClient.get).toHaveBeenCalledWith('/notifications', { params });
    });
  });

  describe('getNotification', () => {
    it('should fetch single notification by id', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: '1',
            type: 'APPROVAL',
            title: 'Test',
            message: 'Test',
            isRead: false,
            createdAt: '2024-01-01T00:00:00Z',
          },
          timestamp: '2024-01-01T00:00:00Z',
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await notificationService.getNotification('1');

      expect(apiClient.get).toHaveBeenCalledWith('/notifications/1');
      expect(result.data.id).toBe('1');
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: null,
          message: '알림이 읽음 처리되었습니다.',
          timestamp: '2024-01-01T00:00:00Z',
        },
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const result = await notificationService.markAsRead('1');

      expect(apiClient.post).toHaveBeenCalledWith('/notifications/1/read');
      expect(result.success).toBe(true);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: null,
          message: '모든 알림이 읽음 처리되었습니다.',
          timestamp: '2024-01-01T00:00:00Z',
        },
      };

      vi.mocked(apiClient.patch).mockResolvedValue(mockResponse);

      const result = await notificationService.markAllAsRead();

      expect(apiClient.patch).toHaveBeenCalledWith('/notifications/read-all');
      expect(result.success).toBe(true);
    });
  });

  describe('deleteNotification', () => {
    it('should delete notification', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: null,
          message: '알림이 삭제되었습니다.',
          timestamp: '2024-01-01T00:00:00Z',
        },
      };

      vi.mocked(apiClient.delete).mockResolvedValue(mockResponse);

      const result = await notificationService.deleteNotification('1');

      expect(apiClient.delete).toHaveBeenCalledWith('/notifications/1');
      expect(result.success).toBe(true);
    });
  });

  describe('deleteNotifications', () => {
    it('should delete multiple notifications', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: { deleted: 3 },
          timestamp: '2024-01-01T00:00:00Z',
        },
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const result = await notificationService.deleteNotifications(['1', '2', '3']);

      expect(apiClient.post).toHaveBeenCalledWith('/notifications/bulk-delete', { ids: ['1', '2', '3'] });
      expect(result.data.deleted).toBe(3);
    });
  });

  describe('getSettings', () => {
    it('should fetch notification settings', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            emailEnabled: true,
            pushEnabled: true,
            browserEnabled: true,
            smsEnabled: false,
            approvalNotifications: true,
            leaveNotifications: true,
            announcementNotifications: true,
            reminderNotifications: true,
            systemNotifications: true,
            digestEnabled: false,
            quietHoursEnabled: false,
          },
          timestamp: '2024-01-01T00:00:00Z',
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await notificationService.getSettings();

      expect(apiClient.get).toHaveBeenCalledWith('/notifications/settings');
      expect(result.data.emailEnabled).toBe(true);
    });
  });

  describe('updateSettings', () => {
    it('should update notification settings', async () => {
      const settings = { emailEnabled: false, pushEnabled: false };
      const mockResponse = {
        data: {
          success: true,
          data: {
            ...settings,
            browserEnabled: true,
            smsEnabled: false,
            approvalNotifications: true,
            leaveNotifications: true,
            announcementNotifications: true,
            reminderNotifications: true,
            systemNotifications: true,
            digestEnabled: false,
            quietHoursEnabled: false,
          },
          timestamp: '2024-01-01T00:00:00Z',
        },
      };

      vi.mocked(apiClient.put).mockResolvedValue(mockResponse);

      const result = await notificationService.updateSettings(settings);

      expect(apiClient.put).toHaveBeenCalledWith('/notifications/settings', settings);
      expect(result.data.emailEnabled).toBe(false);
    });
  });

  describe('getUnreadCount', () => {
    it('should fetch unread count', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: 5,
          timestamp: '2024-01-01T00:00:00Z',
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await notificationService.getUnreadCount();

      expect(apiClient.get).toHaveBeenCalledWith('/notifications/my/unread/count');
      expect(result.data).toBe(5);
    });
  });

  describe('error handling', () => {
    it('should propagate errors from API', async () => {
      const error = new Error('Network error');
      vi.mocked(apiClient.get).mockRejectedValue(error);

      await expect(notificationService.getNotifications()).rejects.toThrow('Network error');
    });
  });
});
