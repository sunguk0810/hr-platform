import { useState, useEffect } from 'react';
import { Bell, BellOff, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePushSubscription } from '@/hooks/usePushSubscription';

interface PushNotificationPromptProps {
  /**
   * Whether to show as a dismissible banner
   * @default false
   */
  banner?: boolean;
  /**
   * Callback when subscription status changes
   */
  onSubscriptionChange?: (subscribed: boolean) => void;
  /**
   * Callback when user dismisses the prompt
   */
  onDismiss?: () => void;
}

/**
 * Component for prompting users to enable push notifications
 */
export function PushNotificationPrompt({
  banner = false,
  onSubscriptionChange,
  onDismiss,
}: PushNotificationPromptProps) {
  const {
    status,
    isSupported,
    isSubscribed,
    isLoading,
    error,
    subscribe,
    unsubscribe,
  } = usePushSubscription();

  const [dismissed, setDismissed] = useState(false);

  // Check if user has previously dismissed the prompt
  useEffect(() => {
    const wasDismissed = localStorage.getItem('push_prompt_dismissed');
    if (wasDismissed) {
      setDismissed(true);
    }
  }, []);

  // Notify parent of subscription changes
  useEffect(() => {
    onSubscriptionChange?.(isSubscribed);
  }, [isSubscribed, onSubscriptionChange]);

  const handleSubscribe = async () => {
    await subscribe();
  };

  const handleUnsubscribe = async () => {
    await unsubscribe();
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('push_prompt_dismissed', 'true');
    onDismiss?.();
  };

  // Don't render if not supported or dismissed
  if (!isSupported || dismissed) {
    return null;
  }

  // Permission denied message
  if (status === 'denied') {
    return (
      <Alert variant="destructive" className="mb-4">
        <BellOff className="h-4 w-4" aria-hidden="true" />
        <AlertDescription>
          알림이 차단되었습니다. 브라우저 설정에서 알림을 허용해주세요.
        </AlertDescription>
      </Alert>
    );
  }

  // Banner style for inline display
  if (banner && !isSubscribed) {
    return (
      <div className="relative mb-4 flex items-center justify-between gap-4 rounded-lg border bg-muted/50 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Bell className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>
          <div>
            <p className="font-medium">푸시 알림 받기</p>
            <p className="text-sm text-muted-foreground">
              중요한 알림을 놓치지 않도록 푸시 알림을 켜세요
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleSubscribe}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
            알림 켜기
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleDismiss}
            aria-label="닫기"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Card style for settings page
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" aria-hidden="true" />
          <CardTitle className="text-lg">웹 푸시 알림</CardTitle>
        </div>
        <CardDescription>
          브라우저에서 실시간 알림을 받을 수 있습니다
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>
              {error.message || '알림 설정 중 오류가 발생했습니다'}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="font-medium">
              {isSubscribed ? '알림이 활성화되었습니다' : '알림이 비활성화되었습니다'}
            </p>
            <p className="text-sm text-muted-foreground">
              {isSubscribed
                ? '새로운 결재, 휴가, 공지사항 등을 실시간으로 받습니다'
                : '푸시 알림을 활성화하면 중요한 소식을 놓치지 않습니다'}
            </p>
          </div>
          {isSubscribed ? (
            <Button
              variant="outline"
              onClick={handleUnsubscribe}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <BellOff className="mr-2 h-4 w-4" aria-hidden="true" />
              )}
              알림 끄기
            </Button>
          ) : (
            <Button
              onClick={handleSubscribe}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Bell className="mr-2 h-4 w-4" aria-hidden="true" />
              )}
              알림 켜기
            </Button>
          )}
        </div>

        {isSubscribed && (
          <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
            <p className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-green-500" aria-hidden="true" />
              현재 이 브라우저에서 알림을 받고 있습니다
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default PushNotificationPrompt;
