import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  eachHourOfInterval,
  isSameDay,
  isToday,
  setHours,
  startOfDay,
  endOfDay,
} from 'date-fns';
import { ko } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { LeaveEvent } from './MonthView';

interface WeekViewProps {
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

export function WeekView({
  currentDate,
  events,
  onDateClick,
  onEventClick,
  selectedDate,
  className,
}: WeekViewProps) {
  const { t } = useTranslation('attendance');
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });

  const days = useMemo(
    () => eachDayOfInterval({ start: weekStart, end: weekEnd }),
    [weekStart, weekEnd]
  );

  const hours = useMemo(
    () =>
      eachHourOfInterval({
        start: setHours(startOfDay(currentDate), 8),
        end: setHours(startOfDay(currentDate), 18),
      }),
    [currentDate]
  );

  const getEventsForDate = (date: Date) => {
    return events.filter(
      (event) =>
        event.startDate <= endOfDay(date) &&
        event.endDate >= startOfDay(date) &&
        (event.status === 'APPROVED' || event.status === 'PENDING')
    );
  };

  return (
    <div className={cn('rounded-lg border bg-card', className)}>
      {/* Header - Day names */}
      <div className="grid grid-cols-8 border-b">
        <div className="w-16 border-r" /> {/* Time column */}
        {days.map((day, index) => {
          const dayOfWeek = day.getDay();
          return (
            <div
              key={day.toISOString()}
              className={cn(
                'flex flex-col items-center py-2',
                index < 6 && 'border-r'
              )}
            >
              <span
                className={cn(
                  'text-sm font-medium',
                  dayOfWeek === 0 && 'text-red-500',
                  dayOfWeek === 6 && 'text-blue-500'
                )}
              >
                {format(day, 'EEE', { locale: ko })}
              </span>
              <span
                className={cn(
                  'mt-1 flex h-8 w-8 items-center justify-center rounded-full text-lg',
                  isToday(day) && 'bg-primary text-primary-foreground font-medium'
                )}
              >
                {format(day, 'd')}
              </span>
            </div>
          );
        })}
      </div>

      {/* All-day events row */}
      <div className="grid grid-cols-8 border-b bg-muted/30">
        <div className="flex w-16 items-center justify-center border-r py-2 text-xs text-muted-foreground">
          {t('components.leaveCalendar.weekView.allDay')}
        </div>
        {days.map((day, index) => {
          const dayEvents = getEventsForDate(day);
          const isSelected = selectedDate && isSameDay(day, selectedDate);

          return (
            <div
              key={day.toISOString()}
              onClick={() => onDateClick?.(day)}
              className={cn(
                'min-h-[60px] p-1',
                index < 6 && 'border-r',
                isSelected && 'bg-primary/5',
                onDateClick && 'cursor-pointer hover:bg-muted/50'
              )}
            >
              <div className="space-y-1">
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
                      'hover:opacity-90 transition-opacity'
                    )}
                    title={`${event.employeeName} - ${event.leaveTypeName}`}
                  >
                    {event.employeeName}
                  </button>
                ))}
                {dayEvents.length > 3 && (
                  <span className="block text-center text-xs text-muted-foreground">
                    {t('components.leaveCalendar.weekView.moreEvents', { count: dayEvents.length - 3 })}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Time grid */}
      <ScrollArea className="h-[400px]">
        <div className="grid grid-cols-8">
          {/* Time labels */}
          <div className="w-16 border-r">
            {hours.map((hour) => (
              <div
                key={hour.toISOString()}
                className="flex h-12 items-start justify-center border-b pr-2 pt-0 text-xs text-muted-foreground"
              >
                {format(hour, 'HH:mm')}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day, dayIndex) => (
            <div
              key={day.toISOString()}
              className={cn(dayIndex < 6 && 'border-r')}
            >
              {hours.map((hour) => (
                <div
                  key={hour.toISOString()}
                  className="h-12 border-b hover:bg-muted/30"
                />
              ))}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

export default WeekView;
