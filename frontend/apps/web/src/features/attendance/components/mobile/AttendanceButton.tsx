import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { LogIn, LogOut, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AttendanceButtonProps {
  type: 'checkIn' | 'checkOut';
  isCompleted: boolean;
  isDisabled?: boolean;
  isLoading?: boolean;
  completedTime?: string;
  onClick: () => void;
}

export function AttendanceButton({
  type,
  isCompleted,
  isDisabled,
  isLoading,
  completedTime,
  onClick,
}: AttendanceButtonProps) {
  const { t } = useTranslation('attendance');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isCheckIn = type === 'checkIn';
  const Icon = isCheckIn ? LogIn : LogOut;

  const buttonStyles = cn(
    'flex-1 flex flex-col items-center justify-center rounded-2xl p-6 transition-colors',
    'border-2',
    isCompleted
      ? 'bg-primary/10 border-primary/30 text-primary'
      : isDisabled
        ? 'bg-muted border-muted-foreground/20 text-muted-foreground'
        : isCheckIn
          ? 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 active:scale-95'
          : 'bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400 active:scale-95'
  );

  return (
    <button
      className={buttonStyles}
      onClick={onClick}
      disabled={isCompleted || isDisabled || isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-10 w-10 mb-2 animate-spin" />
      ) : isCompleted ? (
        <CheckCircle2 className="h-10 w-10 mb-2" />
      ) : (
        <Icon className="h-10 w-10 mb-2" />
      )}

      <span className="text-lg font-semibold">
        {isCheckIn ? t('components.mobile.attendanceButton.checkIn') : t('components.mobile.attendanceButton.checkOut')}
      </span>

      {isCompleted && completedTime ? (
        <span className="text-sm mt-1 font-mono">{completedTime}</span>
      ) : !isDisabled && (
        <span className="text-xs mt-1 text-muted-foreground">
          {format(currentTime, 'HH:mm:ss')}
        </span>
      )}
    </button>
  );
}

interface AttendanceButtonGroupProps {
  checkInTime?: string;
  checkOutTime?: string;
  isCheckingIn?: boolean;
  isCheckingOut?: boolean;
  onCheckIn: () => void;
  onCheckOut: () => void;
}

export function AttendanceButtonGroup({
  checkInTime,
  checkOutTime,
  isCheckingIn,
  isCheckingOut,
  onCheckIn,
  onCheckOut,
}: AttendanceButtonGroupProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-4">
      {/* Current Time Display */}
      <div className="text-center py-4">
        <p className="text-sm text-muted-foreground">
          {format(currentTime, 'yyyy년 M월 d일 EEEE', { locale: ko })}
        </p>
        <p className="text-4xl font-bold tabular-nums mt-1">
          {format(currentTime, 'HH:mm:ss')}
        </p>
      </div>

      {/* Check In/Out Buttons */}
      <div className="flex gap-4">
        <AttendanceButton
          type="checkIn"
          isCompleted={!!checkInTime}
          isLoading={isCheckingIn}
          completedTime={checkInTime?.slice(0, 5)}
          onClick={onCheckIn}
        />
        <AttendanceButton
          type="checkOut"
          isCompleted={!!checkOutTime}
          isDisabled={!checkInTime}
          isLoading={isCheckingOut}
          completedTime={checkOutTime?.slice(0, 5)}
          onClick={onCheckOut}
        />
      </div>
    </div>
  );
}
