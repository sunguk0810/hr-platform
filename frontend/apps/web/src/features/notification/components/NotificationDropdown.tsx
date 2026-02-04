import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Settings, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { NotificationItem, NotificationData } from './NotificationItem';
import { cn } from '@/lib/utils';

interface NotificationDropdownProps {
  notifications: NotificationData[];
  unreadCount?: number;
  onNotificationClick?: (notification: NotificationData) => void;
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onDelete?: (id: string) => void;
  className?: string;
}

export function NotificationDropdown({
  notifications,
  unreadCount = 0,
  onNotificationClick,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  className,
}: NotificationDropdownProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const unreadNotifications = notifications.filter((n) => !n.isRead);
  const hasUnread = unreadNotifications.length > 0;

  const handleNotificationClick = (notification: NotificationData) => {
    onNotificationClick?.(notification);
    setOpen(false);

    if (notification.link) {
      navigate(notification.link);
    }
  };

  const handleViewAll = () => {
    setOpen(false);
    navigate('/notifications');
  };

  const handleSettings = () => {
    setOpen(false);
    navigate('/settings/notifications');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn('relative', className)}
          aria-label="알림"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[380px] p-0" align="end">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="font-semibold">알림</h3>
          <div className="flex items-center gap-1">
            {hasUnread && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onMarkAllAsRead}
                className="h-8 text-xs"
              >
                <Check className="mr-1 h-3 w-3" />
                모두 읽음
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleSettings}
              aria-label="알림 설정"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b px-4">
            <TabsTrigger value="all" className="text-xs">
              전체
            </TabsTrigger>
            <TabsTrigger value="unread" className="text-xs">
              읽지 않음
              {unreadNotifications.length > 0 && (
                <span className="ml-1 rounded-full bg-primary/10 px-1.5 text-primary">
                  {unreadNotifications.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[400px]">
            <TabsContent value="all" className="m-0">
              {notifications.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  알림이 없습니다
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.slice(0, 10).map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onClick={handleNotificationClick}
                      onMarkAsRead={onMarkAsRead}
                      onDelete={onDelete}
                      showActions={false}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="unread" className="m-0">
              {unreadNotifications.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  읽지 않은 알림이 없습니다
                </div>
              ) : (
                <div className="divide-y">
                  {unreadNotifications.slice(0, 10).map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onClick={handleNotificationClick}
                      onMarkAsRead={onMarkAsRead}
                      onDelete={onDelete}
                      showActions={false}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        {/* Footer */}
        <div className="border-t p-2">
          <Button
            variant="ghost"
            className="w-full"
            onClick={handleViewAll}
          >
            모든 알림 보기
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default NotificationDropdown;
