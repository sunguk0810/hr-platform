import { useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Check, Trash2, RefreshCw, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EmptyState } from '@/components/common/EmptyState';
import { useNotificationStore } from '@/stores/notificationStore';
import { NotificationCard, NotificationTabs, NotificationDateGroup } from '../components/mobile';
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
  useRefreshNotifications,
} from '../hooks/useNotifications';
import { useIsMobile, useIsTablet } from '@/hooks/useMediaQuery';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { cn } from '@/lib/utils';

type TabValue = 'all' | 'unread' | 'approval' | 'system';

export default function NotificationCenterPage() {
  const { notifications, unreadCount, clearAll } = useNotificationStore();
  const [activeTab, setActiveTab] = useState<TabValue>('all');
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  // API hooks
  useNotifications(); // Sync notifications from server to store
  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();
  const deleteNotificationMutation = useDeleteNotification();
  const refreshNotifications = useRefreshNotifications();

  // Handler functions
  const handleMarkAsRead = (id: string) => {
    markAsReadMutation.mutate(id);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleDeleteNotification = (id: string) => {
    deleteNotificationMutation.mutate(id);
  };

  // Pull to refresh for mobile - now connected to actual API
  const handleRefresh = async () => {
    await refreshNotifications();
  };

  const { isPulling, isRefreshing, pullProgress, pullDistance, handlers } = usePullToRefresh({
    onRefresh: handleRefresh,
  });

  // Filter notifications based on active tab
  const getFilteredNotifications = () => {
    switch (activeTab) {
      case 'unread':
        return notifications.filter((n) => !n.isRead);
      case 'approval':
        return notifications.filter((n) => n.type === 'APPROVAL');
      case 'system':
        return notifications.filter((n) => n.type === 'SYSTEM');
      default:
        return notifications;
    }
  };

  const filteredNotifications = getFilteredNotifications();

  const counts = {
    all: notifications.length,
    unread: notifications.filter((n) => !n.isRead).length,
    approval: notifications.filter((n) => n.type === 'APPROVAL').length,
    system: notifications.filter((n) => n.type === 'SYSTEM').length,
  };

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="min-h-full" {...handlers}>
        {/* Pull to refresh indicator */}
        {(isPulling || isRefreshing) && (
          <div
            className="flex justify-center items-center py-4"
            style={{ height: pullDistance }}
          >
            <RefreshCw
              className={cn(
                'h-6 w-6 text-primary transition-transform',
                isRefreshing && 'animate-spin',
                pullProgress >= 1 && !isRefreshing && 'text-green-500'
              )}
              style={{
                transform: `rotate(${pullProgress * 180}deg)`,
              }}
            />
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">알림센터</h1>
            {unreadCount > 0 && (
              <span className="rounded-full bg-destructive px-2 py-0.5 text-xs font-medium text-destructive-foreground">
                {unreadCount}
              </span>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleMarkAllAsRead} disabled={unreadCount === 0 || markAllAsReadMutation.isPending}>
                <Check className="mr-2 h-4 w-4" />
                모두 읽음
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={clearAll}
                disabled={notifications.length === 0}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                전체 삭제
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Tabs */}
        <div className="mb-4">
          <NotificationTabs value={activeTab} onChange={setActiveTab} counts={counts} />
        </div>

        {/* Notification List */}
        {filteredNotifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title={
              activeTab === 'unread'
                ? '읽지 않은 알림이 없습니다'
                : activeTab === 'approval'
                  ? '결재 알림이 없습니다'
                  : activeTab === 'system'
                    ? '시스템 알림이 없습니다'
                    : '알림이 없습니다'
            }
            description={
              activeTab === 'unread'
                ? '모든 알림을 확인했습니다.'
                : '새로운 알림이 있으면 여기에 표시됩니다.'
            }
          />
        ) : (
          <NotificationDateGroup
            notifications={filteredNotifications}
            renderItem={(notification) => (
              <NotificationCard
                id={notification.id}
                title={notification.title}
                message={notification.message}
                type={notification.type}
                isRead={notification.isRead}
                createdAt={notification.createdAt}
                onClick={() => handleMarkAsRead(notification.id)}
                onDelete={() => handleDeleteNotification(notification.id)}
              />
            )}
          />
        )}
      </div>
    );
  }

  // Tablet Layout - 2 Column Grid
  if (isTablet) {
    return (
      <div className="min-h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">알림센터</h1>
            {unreadCount > 0 && (
              <span className="rounded-full bg-destructive px-2.5 py-1 text-sm font-medium text-destructive-foreground">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0 || markAllAsReadMutation.isPending}
            >
              <Check className="mr-2 h-4 w-4" />
              모두 읽음
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearAll}
              disabled={notifications.length === 0}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              전체 삭제
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-4">
          <NotificationTabs value={activeTab} onChange={setActiveTab} counts={counts} />
        </div>

        {/* Notification Grid - 2 Columns */}
        {filteredNotifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title={
              activeTab === 'unread'
                ? '읽지 않은 알림이 없습니다'
                : activeTab === 'approval'
                  ? '결재 알림이 없습니다'
                  : activeTab === 'system'
                    ? '시스템 알림이 없습니다'
                    : '알림이 없습니다'
            }
            description={
              activeTab === 'unread'
                ? '모든 알림을 확인했습니다.'
                : '새로운 알림이 있으면 여기에 표시됩니다.'
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filteredNotifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                id={notification.id}
                title={notification.title}
                message={notification.message}
                type={notification.type}
                isRead={notification.isRead}
                createdAt={notification.createdAt}
                onClick={() => handleMarkAsRead(notification.id)}
                onDelete={() => handleDeleteNotification(notification.id)}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Desktop Layout
  return (
    <>
      <PageHeader
        title="알림센터"
        description="알림을 확인하고 관리합니다."
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0 || markAllAsReadMutation.isPending}
            >
              <Check className="mr-2 h-4 w-4" />
              모두 읽음
            </Button>
            <Button
              variant="outline"
              onClick={clearAll}
              disabled={notifications.length === 0}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              전체 삭제
            </Button>
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            알림
            {unreadCount > 0 && (
              <span className="rounded-full bg-destructive px-2 py-0.5 text-xs text-destructive-foreground">
                {unreadCount}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">전체</TabsTrigger>
              <TabsTrigger value="unread">읽지 않음</TabsTrigger>
              <TabsTrigger value="approval">결재</TabsTrigger>
              <TabsTrigger value="system">시스템</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-4">
              {notifications.length === 0 ? (
                <EmptyState
                  icon={Bell}
                  title="알림이 없습니다"
                  description="새로운 알림이 있으면 여기에 표시됩니다."
                />
              ) : (
                <div className="space-y-2">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`rounded-lg border p-4 ${
                        notification.isRead ? 'bg-background' : 'bg-accent/50'
                      }`}
                    >
                      <p className="font-medium">{notification.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {notification.message}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(notification.createdAt).toLocaleString('ko-KR')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="unread" className="mt-4">
              {notifications.filter(n => !n.isRead).length === 0 ? (
                <EmptyState
                  icon={Bell}
                  title="읽지 않은 알림이 없습니다"
                  description="모든 알림을 확인했습니다."
                />
              ) : (
                <div className="space-y-2">
                  {notifications.filter(n => !n.isRead).map((notification) => (
                    <div
                      key={notification.id}
                      className="rounded-lg border p-4 bg-accent/50"
                    >
                      <p className="font-medium">{notification.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {notification.message}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(notification.createdAt).toLocaleString('ko-KR')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="approval" className="mt-4">
              {notifications.filter(n => n.type === 'APPROVAL').length === 0 ? (
                <EmptyState
                  icon={Bell}
                  title="결재 알림이 없습니다"
                  description="결재 관련 알림이 있으면 여기에 표시됩니다."
                />
              ) : (
                <div className="space-y-2">
                  {notifications.filter(n => n.type === 'APPROVAL').map((notification) => (
                    <div
                      key={notification.id}
                      className={`rounded-lg border p-4 ${
                        notification.isRead ? 'bg-background' : 'bg-accent/50'
                      }`}
                    >
                      <p className="font-medium">{notification.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {notification.message}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(notification.createdAt).toLocaleString('ko-KR')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="system" className="mt-4">
              {notifications.filter(n => n.type === 'SYSTEM').length === 0 ? (
                <EmptyState
                  icon={Bell}
                  title="시스템 알림이 없습니다"
                  description="시스템 관련 알림이 있으면 여기에 표시됩니다."
                />
              ) : (
                <div className="space-y-2">
                  {notifications.filter(n => n.type === 'SYSTEM').map((notification) => (
                    <div
                      key={notification.id}
                      className={`rounded-lg border p-4 ${
                        notification.isRead ? 'bg-background' : 'bg-accent/50'
                      }`}
                    >
                      <p className="font-medium">{notification.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {notification.message}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(notification.createdAt).toLocaleString('ko-KR')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </>
  );
}
