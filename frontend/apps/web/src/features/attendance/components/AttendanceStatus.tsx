import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AttendanceStatusBadge } from '@/components/common/StatusBadge';
import { Skeleton } from '@/components/common/Skeleton';
import { useTodayAttendance } from '../hooks/useAttendance';
import { Clock, LogIn, LogOut, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AttendanceStatusProps {
  className?: string;
  showCard?: boolean;
}

export function AttendanceStatus({ className, showCard = true }: AttendanceStatusProps) {
  const { t } = useTranslation('attendance');
  const { data: todayData, isLoading } = useTodayAttendance();

  const today = todayData?.data;

  const content = (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          <LogIn className="h-4 w-4" />
          <span className="text-sm">{t('components.attendanceStatus.checkIn')}</span>
        </div>
        <span className={cn('font-mono text-sm', today?.checkInTime && 'font-medium')}>
          {today?.checkInTime?.slice(0, 5) || '-'}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          <LogOut className="h-4 w-4" />
          <span className="text-sm">{t('components.attendanceStatus.checkOut')}</span>
        </div>
        <span className={cn('font-mono text-sm', today?.checkOutTime && 'font-medium')}>
          {today?.checkOutTime?.slice(0, 5) || '-'}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Timer className="h-4 w-4" />
          <span className="text-sm">{t('components.attendanceStatus.workingHours')}</span>
        </div>
        <span className="text-sm font-medium">
          {today?.workingHours ? t('components.attendanceStatus.workingHoursUnit', { hours: today.workingHours }) : '-'}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span className="text-sm">{t('components.attendanceStatus.status')}</span>
        </div>
        {today?.status ? (
          <AttendanceStatusBadge status={today.status} />
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        )}
      </div>
    </div>
  );

  if (isLoading) {
    const skeleton = (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex justify-between">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-12" />
          </div>
        ))}
      </div>
    );

    return showCard ? (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-24" />
        </CardHeader>
        <CardContent>{skeleton}</CardContent>
      </Card>
    ) : (
      <div className={className}>{skeleton}</div>
    );
  }

  if (!showCard) {
    return <div className={className}>{content}</div>;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">{t('components.attendanceStatus.title')}</CardTitle>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}
