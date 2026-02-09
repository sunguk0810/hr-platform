import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ko, enUS } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, CheckCircle2, Loader2 } from 'lucide-react';
import { useCheckIn, useCheckOut, useTodayAttendance } from '../hooks/useAttendance';
import { cn } from '@/lib/utils';

export interface CheckInOutButtonProps {
  variant?: 'default' | 'compact' | 'card';
  showTime?: boolean;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function CheckInOutButton({
  variant = 'default',
  showTime = true,
  onSuccess,
  onError,
}: CheckInOutButtonProps) {
  const { t, i18n } = useTranslation('attendance');
  const { t: tCommon } = useTranslation('common');
  const dateLocale = i18n.language === 'ko' ? ko : enUS;
  const [currentTime, setCurrentTime] = React.useState(new Date());
  const { data: todayData, isLoading } = useTodayAttendance();
  const checkInMutation = useCheckIn();
  const checkOutMutation = useCheckOut();

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const today = todayData?.data;
  const isCheckedIn = !!today?.checkInTime;
  const isCheckedOut = !!today?.checkOutTime;

  const handleCheckIn = async () => {
    try {
      await checkInMutation.mutateAsync();
      onSuccess?.();
    } catch (error) {
      onError?.(error as Error);
    }
  };

  const handleCheckOut = async () => {
    try {
      await checkOutMutation.mutateAsync();
      onSuccess?.();
    } catch (error) {
      onError?.(error as Error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={handleCheckIn}
          disabled={isCheckedIn || checkInMutation.isPending}
        >
          {checkInMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isCheckedIn ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <LogIn className="h-4 w-4" />
          )}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleCheckOut}
          disabled={!isCheckedIn || isCheckedOut || checkOutMutation.isPending}
        >
          {checkOutMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isCheckedOut ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <LogOut className="h-4 w-4" />
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', variant === 'card' && 'p-4 border rounded-lg')}>
      {showTime && (
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            {format(currentTime, tCommon('dateFormat.fullDate'), { locale: dateLocale })}
          </p>
          <p className="mt-2 text-4xl font-bold tabular-nums">
            {format(currentTime, 'HH:mm:ss')}
          </p>
        </div>
      )}
      <div className="flex gap-2">
        <Button
          className="flex-1"
          onClick={handleCheckIn}
          disabled={isCheckedIn || checkInMutation.isPending}
        >
          {checkInMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('components.checkInOutButton.processing')}
            </>
          ) : isCheckedIn ? (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {t('components.checkInOutButton.checkInDone', { time: today?.checkInTime?.slice(0, 5) })}
            </>
          ) : (
            <>
              <LogIn className="mr-2 h-4 w-4" />
              {t('components.checkInOutButton.checkIn')}
            </>
          )}
        </Button>
        <Button
          variant="outline"
          className="flex-1"
          onClick={handleCheckOut}
          disabled={!isCheckedIn || isCheckedOut || checkOutMutation.isPending}
        >
          {checkOutMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('components.checkInOutButton.processing')}
            </>
          ) : isCheckedOut ? (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {t('components.checkInOutButton.checkOutDone', { time: today?.checkOutTime?.slice(0, 5) })}
            </>
          ) : (
            <>
              <LogOut className="mr-2 h-4 w-4" />
              {t('components.checkInOutButton.checkOut')}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
