import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotificationStore, type Notification } from '@/stores/notificationStore';
import {
  Bell,
  BellRing,
  CheckCheck,
  ExternalLink,
  FileCheck,
  Calendar,
  Users,
  Settings,
  Info,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

export interface NotificationBellProps {
  className?: string;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'APPROVAL_REQUESTED':
    case 'APPROVAL_APPROVED':
    case 'APPROVAL_REJECTED':
      return FileCheck;
    case 'LEAVE_REQUESTED':
    case 'LEAVE_APPROVED':
    case 'LEAVE_REJECTED':
      return Calendar;
    case 'EMPLOYEE_JOINED':
    case 'EMPLOYEE_RESIGNED':
      return Users;
    case 'SYSTEM':
      return Settings;
    case 'ANNOUNCEMENT':
      return Info;
    default:
      return Info;
  }
};

export function NotificationBell({ className }: NotificationBellProps) {
  const { t } = useTranslation('notification');
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  } = useNotificationStore();

  const [isOpen, setIsOpen] = React.useState(false);

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.linkUrl) {
      navigate(notification.linkUrl);
      setIsOpen(false);
    }
  };

  const handleMarkAllAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    markAllAsRead();
  };

  const handleViewAll = () => {
    navigate('/notifications');
    setIsOpen(false);
  };

  const recentNotifications = notifications.slice(0, 10);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn('relative', className)}
          aria-label={unreadCount > 0 ? t('bell.ariaLabelWithCount', { count: unreadCount }) : t('bell.ariaLabel')}
        >
          {unreadCount > 0 ? (
            <BellRing className="h-5 w-5" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {unreadCount > 0 && (
            <span
              className={cn(
                'absolute -top-1 -right-1 flex items-center justify-center',
                'min-w-[18px] h-[18px] px-1 rounded-full',
                'bg-red-500 text-white text-[10px] font-medium',
                unreadCount > 99 && 'text-[8px]'
              )}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>{t('dropdown.title')}</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
              onClick={handleMarkAllAsRead}
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              {t('dropdown.markAllAsRead')}
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {recentNotifications.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <Bell className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{t('dropdown.noNotifications')}</p>
          </div>
        ) : (
          <>
            <ScrollArea className="h-[320px]">
              <div className="p-2 space-y-1">
                {recentNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onClick={() => handleNotificationClick(notification)}
                  />
                ))}
              </div>
            </ScrollArea>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button
                variant="ghost"
                className="w-full justify-center text-sm"
                onClick={handleViewAll}
              >
                {t('dropdown.viewAll')}
                <ExternalLink className="ml-2 h-3 w-3" />
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface NotificationItemProps {
  notification: Notification;
  onClick: () => void;
}

function NotificationItem({ notification, onClick }: NotificationItemProps) {
  const Icon = getNotificationIcon(notification.notificationType);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full flex items-start gap-3 p-2 rounded-md text-left transition-colors',
        'hover:bg-muted',
        !notification.isRead && 'bg-primary/5'
      )}
    >
      <div
        className={cn(
          'flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center',
          notification.isRead ? 'bg-muted' : 'bg-primary/10'
        )}
      >
        <Icon
          className={cn(
            'h-4 w-4',
            notification.isRead ? 'text-muted-foreground' : 'text-primary'
          )}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              'text-sm line-clamp-1',
              !notification.isRead && 'font-medium'
            )}
          >
            {notification.title}
          </p>
          {!notification.isRead && (
            <span className="flex-shrink-0 h-2 w-2 rounded-full bg-primary" />
          )}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
          {notification.content}
        </p>
        <p className="text-[10px] text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(notification.createdAt), {
            addSuffix: true,
            locale: ko,
          })}
        </p>
      </div>
    </button>
  );
}
