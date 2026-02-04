import { BaseEntity, PageRequest } from './common';

export type NotificationType = 'APPROVAL' | 'ATTENDANCE' | 'SYSTEM' | 'ANNOUNCEMENT' | 'LEAVE';

export interface Notification extends BaseEntity {
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationSettings {
  // Channel settings
  emailEnabled: boolean;
  pushEnabled: boolean;
  browserEnabled: boolean;
  smsEnabled: boolean;

  // Category settings
  approvalNotifications: boolean;
  leaveNotifications: boolean;
  announcementNotifications: boolean;
  reminderNotifications: boolean;
  systemNotifications: boolean;

  // Additional settings
  digestEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart?: string; // HH:mm format
  quietHoursEnd?: string; // HH:mm format
}

export interface NotificationPreferences {
  language: string;
  timezone: string;
  emailDigestFrequency: 'DAILY' | 'WEEKLY' | 'NEVER';
}

export interface NotificationSearchParams extends PageRequest {
  type?: NotificationType;
  unreadOnly?: boolean;
  startDate?: string;
  endDate?: string;
}

export interface UnreadCountResponse {
  count: number;
}

export interface UpdateNotificationSettingsRequest {
  emailEnabled?: boolean;
  pushEnabled?: boolean;
  browserEnabled?: boolean;
  smsEnabled?: boolean;
  approvalNotifications?: boolean;
  leaveNotifications?: boolean;
  announcementNotifications?: boolean;
  reminderNotifications?: boolean;
  systemNotifications?: boolean;
  digestEnabled?: boolean;
  quietHoursEnabled?: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
}

export interface BulkNotificationActionRequest {
  ids: string[];
}

export interface BulkNotificationActionResponse {
  processed: number;
  failed: number;
}
