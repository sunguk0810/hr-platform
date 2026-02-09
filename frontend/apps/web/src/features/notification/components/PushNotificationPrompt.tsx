import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('notification');
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
          {t('push.denied')}
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
            <p className="font-medium">{t('push.banner.title')}</p>
            <p className="text-sm text-muted-foreground">
              {t('push.banner.description')}
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
            {t('push.enableButton')}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleDismiss}
            aria-label={t('push.close')}
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
          <CardTitle className="text-lg">{t('push.card.title')}</CardTitle>
        </div>
        <CardDescription>
          {t('push.card.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>
              {error.message || t('push.error')}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="font-medium">
              {isSubscribed ? t('push.status.enabled') : t('push.status.disabled')}
            </p>
            <p className="text-sm text-muted-foreground">
              {isSubscribed
                ? t('push.status.enabledDescription')
                : t('push.status.disabledDescription')}
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
              {t('push.disableButton')}
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
              {t('push.enableButton')}
            </Button>
          )}
        </div>

        {isSubscribed && (
          <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
            <p className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-green-500" aria-hidden="true" />
              {t('push.status.currentBrowser')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default PushNotificationPrompt;
