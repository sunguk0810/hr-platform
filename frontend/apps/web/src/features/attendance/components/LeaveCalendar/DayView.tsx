import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  format,
  eachHourOfInterval,
  setHours,
  startOfDay,
  endOfDay,
  isToday,
} from 'date-fns';
import { ko, enUS } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { LeaveEvent } from './MonthView';

interface DayViewProps {
  currentDate: Date;
  events: LeaveEvent[];
  onEventClick?: (event: LeaveEvent) => void;
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

// statusLabels moved to translation: components.leaveCalendar.dayView.statusLabels

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function DayView({
  currentDate,
  events,
  onEventClick,
  className,
}: DayViewProps) {
  const { t, i18n } = useTranslation('attendance');
  const { t: tCommon } = useTranslation('common');
  const dateLocale = i18n.language === 'ko' ? ko : enUS;
  const hours = useMemo(
    () =>
      eachHourOfInterval({
        start: setHours(startOfDay(currentDate), 0),
        end: setHours(startOfDay(currentDate), 23),
      }),
    [currentDate]
  );

  const dayEvents = events.filter(
    (event) =>
      event.startDate <= endOfDay(currentDate) &&
      event.endDate >= startOfDay(currentDate)
  );

  return (
    <div className={cn('rounded-lg border bg-card', className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <h3 className="text-lg font-medium">
            {format(currentDate, tCommon('dateFormat.fullDateWithDay'), { locale: dateLocale })}
          </h3>
          {isToday(currentDate) && (
            <span className="text-sm text-muted-foreground">{t('components.leaveCalendar.dayView.today')}</span>
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          {t('components.leaveCalendar.dayView.leaveCount', { count: dayEvents.length })}
        </div>
      </div>

      <div className="flex">
        {/* Time grid */}
        <ScrollArea className="h-[500px] flex-1">
          <div className="relative">
            {hours.map((hour) => (
              <div
                key={hour.toISOString()}
                className="flex h-12 border-b"
              >
                <div className="flex w-16 shrink-0 items-start justify-center border-r pt-0 text-xs text-muted-foreground">
                  {format(hour, 'HH:mm')}
                </div>
                <div className="flex-1 hover:bg-muted/30" />
              </div>
            ))}

            {/* Current time indicator */}
            {isToday(currentDate) && <CurrentTimeIndicator />}
          </div>
        </ScrollArea>

        {/* Events sidebar */}
        <div className="w-72 border-l">
          <div className="border-b px-3 py-2">
            <h4 className="text-sm font-medium">{t('components.leaveCalendar.dayView.leaveListTitle')}</h4>
          </div>
          <ScrollArea className="h-[464px]">
            {dayEvents.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                {t('components.leaveCalendar.dayView.noLeaves')}
              </div>
            ) : (
              <div className="space-y-2 p-2">
                {dayEvents.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => onEventClick?.(event)}
                    className="w-full rounded-lg border p-3 text-left transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {getInitials(event.employeeName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{event.employeeName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={cn(
                              'inline-block h-2 w-2 rounded-full',
                              event.color ||
                                leaveTypeColors[event.leaveType] ||
                                leaveTypeColors.DEFAULT
                            )}
                          />
                          <span className="text-xs text-muted-foreground">
                            {event.leaveTypeName}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {format(event.startDate, 'M/d')} ~{' '}
                          {format(event.endDate, 'M/d')}
                        </div>
                        <span
                          className={cn(
                            'mt-1 inline-block rounded px-1.5 py-0.5 text-xs',
                            event.status === 'APPROVED' &&
                              'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
                            event.status === 'PENDING' &&
                              'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
                            event.status === 'REJECTED' &&
                              'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                          )}
                        >
                          {t(`components.leaveCalendar.dayView.statusLabels.${event.status}`)}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

function CurrentTimeIndicator() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const top = (hours * 60 + minutes) * (48 / 60); // 48px per hour

  return (
    <div
      className="absolute left-16 right-0 flex items-center"
      style={{ top: `${top}px` }}
    >
      <div className="h-2 w-2 rounded-full bg-red-500" />
      <div className="h-px flex-1 bg-red-500" />
    </div>
  );
}

export default DayView;
