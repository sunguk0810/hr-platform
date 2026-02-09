import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns';
import { cn } from '@/lib/utils';

export interface LeaveEvent {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: string;
  leaveTypeName: string;
  startDate: Date;
  endDate: Date;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  color?: string;
}

interface MonthViewProps {
  currentDate: Date;
  events: LeaveEvent[];
  onDateClick?: (date: Date) => void;
  onEventClick?: (event: LeaveEvent) => void;
  selectedDate?: Date;
  className?: string;
}

const leaveTypeColors: Record<string, string> = {
  ANNUAL: 'bg-blue-500',
  SICK: 'bg-red-500',
  PERSONAL: 'bg-green-500',
  SPECIAL: 'bg-purple-500',
  HALF_DAY: 'bg-amber-500',
  DEFAULT: 'bg-gray-500',
};

const statusStyles: Record<string, string> = {
  PENDING: 'opacity-60 border-dashed',
  APPROVED: '',
  REJECTED: 'line-through opacity-40',
  CANCELLED: 'line-through opacity-40',
};

export function MonthView({
  currentDate,
  events,
  onDateClick,
  onEventClick,
  selectedDate,
  className,
}: MonthViewProps) {
  const { t } = useTranslation('attendance');
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days = useMemo(
    () => eachDayOfInterval({ start: calendarStart, end: calendarEnd }),
    [calendarStart, calendarEnd]
  );

  const weekDays = t('components.leaveCalendar.monthView.weekDays', { returnObjects: true }) as string[];

  const getEventsForDate = (date: Date) => {
    return events.filter(
      (event) =>
        event.startDate <= date &&
        event.endDate >= date &&
        (event.status === 'APPROVED' || event.status === 'PENDING')
    );
  };

  return (
    <div className={cn('rounded-lg border bg-card', className)}>
      {/* Header - Weekday names */}
      <div className="grid grid-cols-7 border-b">
        {weekDays.map((day, index) => (
          <div
            key={day}
            className={cn(
              'py-2 text-center text-sm font-medium',
              index === 0 && 'text-red-500',
              index === 6 && 'text-blue-500'
            )}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {days.map((day, index) => {
          const dayEvents = getEventsForDate(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const dayOfWeek = day.getDay();

          return (
            <div
              key={day.toISOString()}
              onClick={() => onDateClick?.(day)}
              className={cn(
                'relative min-h-[100px] border-b border-r p-1 transition-colors',
                index % 7 === 6 && 'border-r-0',
                Math.floor(index / 7) === Math.floor((days.length - 1) / 7) &&
                  'border-b-0',
                !isCurrentMonth && 'bg-muted/30',
                isSelected && 'bg-primary/5 ring-2 ring-primary ring-inset',
                onDateClick && 'cursor-pointer hover:bg-muted/50'
              )}
            >
              {/* Date number */}
              <div className="flex items-center justify-between px-1">
                <span
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full text-sm',
                    !isCurrentMonth && 'text-muted-foreground',
                    isToday(day) && 'bg-primary text-primary-foreground font-medium',
                    dayOfWeek === 0 && isCurrentMonth && !isToday(day) && 'text-red-500',
                    dayOfWeek === 6 && isCurrentMonth && !isToday(day) && 'text-blue-500'
                  )}
                >
                  {format(day, 'd')}
                </span>
                {dayEvents.length > 3 && (
                  <span className="text-xs text-muted-foreground">
                    +{dayEvents.length - 3}
                  </span>
                )}
              </div>

              {/* Events */}
              <div className="mt-1 space-y-0.5">
                {dayEvents.slice(0, 3).map((event) => (
                  <button
                    key={event.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick?.(event);
                    }}
                    className={cn(
                      'w-full truncate rounded px-1.5 py-0.5 text-left text-xs text-white',
                      event.color || leaveTypeColors[event.leaveType] || leaveTypeColors.DEFAULT,
                      statusStyles[event.status],
                      'hover:opacity-90 transition-opacity'
                    )}
                    title={`${event.employeeName} - ${event.leaveTypeName}`}
                  >
                    {event.employeeName}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default MonthView;
