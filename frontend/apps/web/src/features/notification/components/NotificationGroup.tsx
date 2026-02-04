import { useMemo } from 'react';
import { format, isToday, isYesterday, startOfDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import { NotificationItem, NotificationData } from './NotificationItem';

interface NotificationGroupProps {
  notifications: NotificationData[];
  groupBy?: 'date' | 'type';
  onNotificationClick?: (notification: NotificationData) => void;
  onMarkAsRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  className?: string;
}

const typeLabels: Record<string, string> = {
  APPROVAL_REQUEST: '결재 요청',
  APPROVAL_RESULT: '결재 결과',
  LEAVE_REQUEST: '휴가 신청',
  LEAVE_RESULT: '휴가 결과',
  ANNOUNCEMENT: '공지사항',
  SYSTEM: '시스템',
  REMINDER: '리마인더',
};

function getDateLabel(date: Date): string {
  if (isToday(date)) return '오늘';
  if (isYesterday(date)) return '어제';
  return format(date, 'M월 d일 (EEE)', { locale: ko });
}

export function NotificationGroup({
  notifications,
  groupBy = 'date',
  onNotificationClick,
  onMarkAsRead,
  onDelete,
  className,
}: NotificationGroupProps) {
  const groupedNotifications = useMemo(() => {
    const groups: Record<string, NotificationData[]> = {};

    notifications.forEach((notification) => {
      let key: string;
      if (groupBy === 'date') {
        key = startOfDay(notification.createdAt).toISOString();
      } else {
        key = notification.type;
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(notification);
    });

    // Sort groups
    const sortedEntries = Object.entries(groups).sort(([a], [b]) => {
      if (groupBy === 'date') {
        return new Date(b).getTime() - new Date(a).getTime();
      }
      return a.localeCompare(b);
    });

    return sortedEntries.map(([key, items]) => ({
      key,
      label: groupBy === 'date' ? getDateLabel(new Date(key)) : typeLabels[key] || key,
      notifications: items.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    }));
  }, [notifications, groupBy]);

  if (notifications.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        알림이 없습니다.
      </div>
    );
  }

  return (
    <div className={className}>
      {groupedNotifications.map((group) => (
        <div key={group.key} className="mb-4">
          <h3 className="sticky top-0 z-10 bg-background px-3 py-2 text-sm font-medium text-muted-foreground">
            {group.label}
          </h3>
          <div className="space-y-1">
            {group.notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClick={onNotificationClick}
                onMarkAsRead={onMarkAsRead}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default NotificationGroup;
