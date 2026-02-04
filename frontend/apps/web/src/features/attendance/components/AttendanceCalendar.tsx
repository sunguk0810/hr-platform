import * as React from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameDay, getDay, isWeekend } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import type { AttendanceRecord, AttendanceStatus } from '@hr-platform/shared-types';

export interface AttendanceCalendarProps {
  records: AttendanceRecord[];
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
  onMonthChange?: (year: number, month: number) => void;
  className?: string;
}

const STATUS_COLORS: Record<AttendanceStatus, string> = {
  NORMAL: 'bg-green-500',
  LATE: 'bg-yellow-500',
  EARLY_LEAVE: 'bg-orange-500',
  ABSENT: 'bg-red-500',
  LEAVE: 'bg-blue-500',
  HALF_DAY: 'bg-blue-300',
  HOLIDAY: 'bg-gray-300',
  OVERTIME: 'bg-purple-500',
  WEEKEND: 'bg-gray-200',
};

const STATUS_LABELS: Record<AttendanceStatus, string> = {
  NORMAL: '정상',
  LATE: '지각',
  EARLY_LEAVE: '조퇴',
  ABSENT: '결근',
  LEAVE: '휴가',
  HALF_DAY: '반차',
  HOLIDAY: '공휴일',
  OVERTIME: '초과근무',
  WEEKEND: '주말',
};

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export function AttendanceCalendar({
  records,
  selectedDate,
  onDateSelect,
  onMonthChange,
  className,
}: AttendanceCalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get the day of week for the first day (0 = Sunday)
  const startDayOfWeek = getDay(monthStart);

  // Create padding for days before the start of the month
  const paddingDays = Array(startDayOfWeek).fill(null);

  // Create a map for quick record lookup
  const recordMap = React.useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    records.forEach((record) => {
      const key = format(new Date(record.date), 'yyyy-MM-dd');
      map.set(key, record);
    });
    return map;
  }, [records]);

  const handlePrevMonth = () => {
    const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    setCurrentMonth(newMonth);
    onMonthChange?.(newMonth.getFullYear(), newMonth.getMonth() + 1);
  };

  const handleNextMonth = () => {
    const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    setCurrentMonth(newMonth);
    onMonthChange?.(newMonth.getFullYear(), newMonth.getMonth() + 1);
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    onMonthChange?.(today.getFullYear(), today.getMonth() + 1);
  };

  const getRecordForDate = (date: Date): AttendanceRecord | undefined => {
    const key = format(date, 'yyyy-MM-dd');
    return recordMap.get(key);
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {format(currentMonth, 'yyyy년 M월', { locale: ko })}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleToday}>
              오늘
            </Button>
            <Button variant="outline" size="icon" onClick={handlePrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {WEEKDAYS.map((day, index) => (
              <div
                key={day}
                className={cn(
                  'text-center text-sm font-medium py-2',
                  index === 0 && 'text-red-500',
                  index === 6 && 'text-blue-500'
                )}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Padding days */}
            {paddingDays.map((_, index) => (
              <div key={`padding-${index}`} className="h-20" />
            ))}

            {/* Days of month */}
            {daysInMonth.map((day) => {
              const record = getRecordForDate(day);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isTodayDate = isToday(day);
              const isWeekendDay = isWeekend(day);
              const dayOfWeek = getDay(day);

              return (
                <Tooltip key={day.toISOString()}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => onDateSelect?.(day)}
                      className={cn(
                        'h-20 p-1 rounded-md border transition-colors flex flex-col',
                        'hover:bg-muted/50',
                        isSelected && 'ring-2 ring-primary',
                        isTodayDate && 'bg-primary/10',
                        isWeekendDay && 'bg-muted/30'
                      )}
                    >
                      <span
                        className={cn(
                          'text-sm font-medium',
                          dayOfWeek === 0 && 'text-red-500',
                          dayOfWeek === 6 && 'text-blue-500',
                          isTodayDate && 'text-primary'
                        )}
                      >
                        {format(day, 'd')}
                      </span>

                      {record && (
                        <div className="flex-1 flex flex-col justify-center items-center gap-1">
                          <div
                            className={cn(
                              'w-3 h-3 rounded-full',
                              STATUS_COLORS[record.status]
                            )}
                          />
                          {record.checkInTime && (
                            <span className="text-[10px] text-muted-foreground">
                              {record.checkInTime.slice(0, 5)}
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  </TooltipTrigger>
                  {record && (
                    <TooltipContent>
                      <div className="space-y-1">
                        <div className="font-medium">{STATUS_LABELS[record.status]}</div>
                        {record.checkInTime && (
                          <div className="text-sm flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            출근: {record.checkInTime}
                          </div>
                        )}
                        {record.checkOutTime && (
                          <div className="text-sm flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            퇴근: {record.checkOutTime}
                          </div>
                        )}
                        {record.workingHours && (
                          <div className="text-sm">
                            근무: {record.workingHours}시간
                          </div>
                        )}
                      </div>
                    </TooltipContent>
                  )}
                </Tooltip>
              );
            })}
          </div>
        </TooltipProvider>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
          {(Object.entries(STATUS_LABELS) as [AttendanceStatus, string][]).slice(0, 6).map(([status, label]) => (
            <div key={status} className="flex items-center gap-1.5">
              <div className={cn('w-3 h-3 rounded-full', STATUS_COLORS[status])} />
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
