import { useTranslation } from 'react-i18next';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { ko } from 'date-fns/locale';
import { FileCheck, AlertCircle, Info, Clock, Trash2 } from 'lucide-react';
import { MobileCard, MobileCardContent } from '@/components/mobile';
import { SwipeableCard } from '@/components/mobile';
import { cn } from '@/lib/utils';

interface NotificationCardProps {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  onClick?: () => void;
  onDelete?: () => void;
  onMarkAsRead?: () => void;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  APPROVAL: <FileCheck className="h-5 w-5" />,
  SYSTEM: <AlertCircle className="h-5 w-5" />,
  ATTENDANCE: <Clock className="h-5 w-5" />,
  GENERAL: <Info className="h-5 w-5" />,
};

const TYPE_COLORS: Record<string, string> = {
  APPROVAL: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300',
  SYSTEM: 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300',
  ATTENDANCE: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300',
  GENERAL: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
};

export function NotificationCard({
  title,
  message,
  type,
  isRead,
  createdAt,
  onClick,
  onDelete,
}: NotificationCardProps) {
  const { t } = useTranslation('notification');

  const formatNotificationDate = (dateString: string): string => {
    const date = new Date(dateString);

    if (isToday(date)) {
      return formatDistanceToNow(date, { addSuffix: true, locale: ko });
    }

    if (isYesterday(date)) {
      return `${t('dateGroup.yesterday')} ${format(date, 'HH:mm')}`;
    }

    return format(date, 'M월 d일 HH:mm', { locale: ko });
  };

  const cardContent = (
    <MobileCard
      onClick={onClick}
      className={cn(
        'mb-2',
        !isRead && 'border-l-4 border-l-primary bg-primary/5'
      )}
    >
      <MobileCardContent>
        <div className="flex gap-3">
          {/* Type Icon */}
          <div
            className={cn(
              'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full',
              TYPE_COLORS[type] || TYPE_COLORS.GENERAL
            )}
          >
            {TYPE_ICONS[type] || TYPE_ICONS.GENERAL}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4
                className={cn(
                  'text-sm line-clamp-1',
                  !isRead ? 'font-semibold text-foreground' : 'font-medium text-foreground/80'
                )}
              >
                {title}
              </h4>
              {!isRead && (
                <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
              )}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
              {message}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatNotificationDate(createdAt)}
            </p>
          </div>
        </div>
      </MobileCardContent>
    </MobileCard>
  );

  if (onDelete) {
    return (
      <SwipeableCard
        rightActions={[
          {
            icon: <Trash2 className="h-5 w-5" />,
            label: t('card.swipeDelete'),
            color: 'destructive',
            onAction: onDelete,
          },
        ]}
      >
        {cardContent}
      </SwipeableCard>
    );
  }

  return cardContent;
}
