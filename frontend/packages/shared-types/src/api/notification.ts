import { BaseEntity, PageRequest } from './common';

// BE enum 기준 세분화된 알림 타입
export type NotificationType =
  | 'APPROVAL_REQUESTED'
  | 'APPROVAL_APPROVED'
  | 'APPROVAL_REJECTED'
  | 'LEAVE_REQUESTED'
  | 'LEAVE_APPROVED'
  | 'LEAVE_REJECTED'
  | 'EMPLOYEE_JOINED'
  | 'EMPLOYEE_RESIGNED'
  | 'ANNOUNCEMENT'
  | 'SYSTEM';

// 카테고리 매핑 (기존 FE 컴포넌트의 카테고리별 그룹핑 지원)
export type NotificationCategory = 'APPROVAL' | 'LEAVE' | 'EMPLOYEE' | 'ANNOUNCEMENT' | 'SYSTEM';

export const NOTIFICATION_TYPE_CATEGORY: Record<NotificationType, NotificationCategory> = {
  APPROVAL_REQUESTED: 'APPROVAL',
  APPROVAL_APPROVED: 'APPROVAL',
  APPROVAL_REJECTED: 'APPROVAL',
  LEAVE_REQUESTED: 'LEAVE',
  LEAVE_APPROVED: 'LEAVE',
  LEAVE_REJECTED: 'LEAVE',
  EMPLOYEE_JOINED: 'EMPLOYEE',
  EMPLOYEE_RESIGNED: 'EMPLOYEE',
  ANNOUNCEMENT: 'ANNOUNCEMENT',
  SYSTEM: 'SYSTEM',
};

export interface Notification extends BaseEntity {
  notificationType: NotificationType;
  title: string;
  content: string;
  isRead: boolean;
  linkUrl?: string;
  // BE 추가 필드
  recipientId?: string;
  channel?: string;
  referenceType?: string;
  referenceId?: string;
  readAt?: string;
  // FE-only (BE에 없음, optional)
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
  notificationType?: NotificationType;
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
