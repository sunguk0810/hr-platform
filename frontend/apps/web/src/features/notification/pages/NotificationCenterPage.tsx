import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Check, Trash2 } from 'lucide-react';
import { EmptyState } from '@/components/common/EmptyState';
import { useNotificationStore } from '@/stores/notificationStore';

export default function NotificationCenterPage() {
  const { notifications, unreadCount, markAllAsRead, clearAll } = useNotificationStore();

  return (
    <>
      <PageHeader
        title="알림센터"
        description="알림을 확인하고 관리합니다."
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
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
              <EmptyState
                icon={Bell}
                title="읽지 않은 알림이 없습니다"
              />
            </TabsContent>
            <TabsContent value="approval" className="mt-4">
              <EmptyState
                icon={Bell}
                title="결재 알림이 없습니다"
              />
            </TabsContent>
            <TabsContent value="system" className="mt-4">
              <EmptyState
                icon={Bell}
                title="시스템 알림이 없습니다"
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </>
  );
}
