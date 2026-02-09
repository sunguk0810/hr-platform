import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
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

export function NotificationGroup({
  notifications,
  groupBy = 'date',
  onNotificationClick,
  onMarkAsRead,
  onDelete,
  className,
}: NotificationGroupProps) {
  const { t } = useTranslation('notification');

  const getDateLabel = (date: Date): string => {
    if (isToday(date)) return t('dateGroup.today');
    if (isYesterday(date)) return t('dateGroup.yesterday');
    return format(date, 'M월 d일 (EEE)', { locale: ko });
  };

  const groupedNotifications = useMemo(() => {
    const groups: Record<string, NotificationData[]> = {};

    notifications.forEach((notification) => {
      let key: string;
      if (groupBy === 'date') {
        key = startOfDay(notification.createdAt).toISOString();
      } else {
        key = notification.notificationType;
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
      label: groupBy === 'date' ? getDateLabel(new Date(key)) : t(`types.${key}`, key),
      notifications: items.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications, groupBy, t]);

  if (notifications.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        {t('group.noNotifications')}
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
