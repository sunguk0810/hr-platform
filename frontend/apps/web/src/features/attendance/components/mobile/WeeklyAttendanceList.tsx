import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { AttendanceStatusBadge } from '@/components/common/StatusBadge';
import type { AttendanceRecord, AttendanceStatus } from '@hr-platform/shared-types';

interface WeeklyAttendanceListProps {
  records: AttendanceRecord[];
  onDayClick?: (date: Date) => void;
}

export function WeeklyAttendanceList({ records, onDayClick }: WeeklyAttendanceListProps) {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday start

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getRecordForDate = (date: Date): AttendanceRecord | undefined => {
    return records.find((record) => isSameDay(new Date(record.date), date));
  };

  const getStatusColor = (status?: AttendanceStatus): string => {
    if (!status) return 'bg-muted';

    const colors: Record<AttendanceStatus, string> = {
      NORMAL: 'bg-green-500',
      LATE: 'bg-yellow-500',
      EARLY_LEAVE: 'bg-orange-500',
      ABSENT: 'bg-red-500',
      WEEKEND: 'bg-gray-300 dark:bg-gray-600',
      HOLIDAY: 'bg-blue-300 dark:bg-blue-600',
      LEAVE: 'bg-purple-500',
      HALF_DAY: 'bg-cyan-500',
      OVERTIME: 'bg-indigo-500',
    };

    return colors[status] || 'bg-muted';
  };

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground mb-3">이번 주 근태</h3>

      {/* Week Day Headers */}
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {['월', '화', '수', '목', '금', '토', '일'].map((day, i) => (
          <span
            key={day}
            className={cn(
              'text-xs font-medium',
              i >= 5 ? 'text-red-500' : 'text-muted-foreground'
            )}
          >
            {day}
          </span>
        ))}
      </div>

      {/* Week Days */}
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((date, i) => {
          const record = getRecordForDate(date);
          const isToday = isSameDay(date, today);
          const isFuture = date > today;
          const isWeekend = i >= 5;

          return (
            <button
              key={date.toISOString()}
              className={cn(
                'flex flex-col items-center justify-center p-2 rounded-lg transition-colors',
                isToday && 'ring-2 ring-primary',
                !isFuture && 'cursor-pointer active:scale-95',
                isFuture && 'opacity-50 cursor-default'
              )}
              onClick={() => !isFuture && onDayClick?.(date)}
              disabled={isFuture}
            >
              <span
                className={cn(
                  'text-sm font-medium',
                  isToday && 'text-primary',
                  isWeekend && !isToday && 'text-red-500'
                )}
              >
                {format(date, 'd')}
              </span>

              {/* Status Indicator */}
              <div
                className={cn(
                  'h-1.5 w-1.5 rounded-full mt-1',
                  isFuture ? 'bg-transparent' : getStatusColor(record?.status)
                )}
              />
            </button>
          );
        })}
      </div>

      {/* Summary List */}
      <div className="mt-4 space-y-2">
        {weekDays.map((date) => {
          const record = getRecordForDate(date);
          const isFuture = date > today;

          if (isFuture || !record) return null;

          return (
            <div
              key={date.toISOString()}
              className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium w-16">
                  {format(date, 'M/d (E)', { locale: ko })}
                </span>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-mono">{record.checkInTime?.slice(0, 5) || '--:--'}</span>
                  <span>~</span>
                  <span className="font-mono">{record.checkOutTime?.slice(0, 5) || '--:--'}</span>
                </div>
              </div>
              <AttendanceStatusBadge status={record.status} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
