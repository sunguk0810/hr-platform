import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { Notification } from '@/stores/notificationStore';

interface NotificationDateGroupProps {
  notifications: Notification[];
  renderItem: (notification: Notification) => ReactNode;
}

export function NotificationDateGroup({
  notifications,
  renderItem,
}: NotificationDateGroupProps) {
  const { t } = useTranslation('notification');

  const getDateLabel = (dateString: string): string => {
    const date = parseISO(dateString);

    if (isToday(date)) {
      return t('dateGroup.today');
    }

    if (isYesterday(date)) {
      return t('dateGroup.yesterday');
    }

    return format(date, 'M월 d일 (E)', { locale: ko });
  };
  if (notifications.length === 0) {
    return null;
  }

  // Group notifications by date
  const groups = notifications.reduce<{ label: string; items: Notification[] }[]>((acc, notification) => {
    const label = getDateLabel(notification.createdAt);
    const existingGroup = acc.find((g) => g.label === label);

    if (existingGroup) {
      existingGroup.items.push(notification);
    } else {
      acc.push({ label, items: [notification] });
    }

    return acc;
  }, []);

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <div key={group.label}>
          <h3 className="text-xs font-medium text-muted-foreground mb-2 sticky top-0 bg-background py-1">
            {group.label}
          </h3>
          <div className="space-y-2">
            {group.items.map((notification) => (
              <div key={notification.id}>{renderItem(notification)}</div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
