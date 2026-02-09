import { useMemo, useRef, useEffect, useState } from 'react';
import {
  format,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  isSameDay,
  isToday,
  isWeekend,
  differenceInDays,
} from 'date-fns';
import { ko } from 'date-fns/locale';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { LeaveEvent } from './MonthView';

interface GanttViewProps {
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

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const DAY_WIDTH = 40;

export function GanttView({
  currentDate,
  events,
  onEventClick,
  className,
}: GanttViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hoveredEvent, setHoveredEvent] = useState<string | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = useMemo(
    () => eachDayOfInterval({ start: monthStart, end: monthEnd }),
    [monthStart, monthEnd]
  );

  // Group events by employee
  const eventsByEmployee = useMemo(() => {
    const grouped: Record<string, LeaveEvent[]> = {};
    events.forEach((event) => {
      if (!grouped[event.employeeId]) {
        grouped[event.employeeId] = [];
      }
      grouped[event.employeeId].push(event);
    });
    return grouped;
  }, [events]);

  const employees = useMemo(() => {
    return Object.entries(eventsByEmployee).map(([employeeId, empEvents]) => ({
      id: employeeId,
      name: empEvents[0]?.employeeName || '',
      events: empEvents,
    }));
  }, [eventsByEmployee]);

  // Scroll to today on mount
  useEffect(() => {
    if (scrollRef.current) {
      const today = new Date();
      const todayIndex = days.findIndex((day) => isSameDay(day, today));
      if (todayIndex !== -1) {
        scrollRef.current.scrollLeft = todayIndex * DAY_WIDTH - 200;
      }
    }
  }, [days]);

  const getEventPosition = (event: LeaveEvent) => {
    const start = event.startDate < monthStart ? monthStart : event.startDate;
    const end = event.endDate > monthEnd ? monthEnd : event.endDate;
    const startOffset = differenceInDays(start, monthStart);
    const duration = differenceInDays(end, start) + 1;
    return {
      left: startOffset * DAY_WIDTH,
      width: duration * DAY_WIDTH - 4,
    };
  };

  return (
    <div className={cn('rounded-lg border bg-card', className)}>
      {/* Header */}
      <div className="border-b px-4 py-3">
        <h3 className="text-lg font-medium">
          {format(currentDate, 'yyyy년 M월', { locale: ko })} Gantt Chart
        </h3>
      </div>

      <div className="flex">
        {/* Employee list (fixed) */}
        <div className="w-48 shrink-0 border-r">
          <div className="h-14 border-b bg-muted/30 px-3 py-2">
            <span className="text-sm font-medium">직원</span>
          </div>
          <div>
            {employees.map((employee) => (
              <div
                key={employee.id}
                className="flex h-12 items-center gap-2 border-b px-3"
              >
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="text-xs">
                    {getInitials(employee.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate text-sm">{employee.name}</span>
              </div>
            ))}
            {employees.length === 0 && (
              <div className="flex h-20 items-center justify-center text-sm text-muted-foreground">
                표시할 데이터가 없습니다
              </div>
            )}
          </div>
        </div>

        {/* Gantt chart (scrollable) */}
        <ScrollArea className="flex-1" ref={scrollRef}>
          <div style={{ width: days.length * DAY_WIDTH }}>
            {/* Days header */}
            <div className="flex h-14 border-b bg-muted/30">
              {days.map((day) => {
                const dayOfWeek = day.getDay();
                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      'flex flex-col items-center justify-center border-r',
                      isWeekend(day) && 'bg-muted/50'
                    )}
                    style={{ width: DAY_WIDTH }}
                  >
                    <span
                      className={cn(
                        'text-[10px]',
                        dayOfWeek === 0 && 'text-red-500',
                        dayOfWeek === 6 && 'text-blue-500'
                      )}
                    >
                      {format(day, 'EEE', { locale: ko })}
                    </span>
                    <span
                      className={cn(
                        'flex h-6 w-6 items-center justify-center rounded-full text-sm',
                        isToday(day) && 'bg-primary text-primary-foreground font-medium'
                      )}
                    >
                      {format(day, 'd')}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Rows */}
            {employees.map((employee) => (
              <div key={employee.id} className="relative flex h-12 border-b">
                {/* Day cells */}
                {days.map((day) => (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      'border-r',
                      isWeekend(day) && 'bg-muted/30'
                    )}
                    style={{ width: DAY_WIDTH }}
                  />
                ))}

                {/* Event bars */}
                {employee.events.map((event) => {
                  const { left, width } = getEventPosition(event);
                  const isHovered = hoveredEvent === event.id;

                  return (
                    <button
                      key={event.id}
                      onClick={() => onEventClick?.(event)}
                      onMouseEnter={() => setHoveredEvent(event.id)}
                      onMouseLeave={() => setHoveredEvent(null)}
                      className={cn(
                        'absolute top-2 h-8 rounded text-xs text-white transition-[left,width]',
                        event.color ||
                          leaveTypeColors[event.leaveType] ||
                          leaveTypeColors.DEFAULT,
                        event.status === 'PENDING' && 'opacity-70',
                        event.status === 'REJECTED' && 'opacity-40',
                        isHovered && 'ring-2 ring-white ring-offset-1 z-10'
                      )}
                      style={{
                        left: `${left}px`,
                        width: `${width}px`,
                      }}
                      title={`${event.employeeName}: ${event.leaveTypeName}`}
                    >
                      <span className="flex h-full items-center justify-center px-2 truncate">
                        {width > 80 && event.leaveTypeName}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 border-t px-4 py-2">
        <span className="text-xs text-muted-foreground">범례:</span>
        {Object.entries(leaveTypeColors).map(
          ([type, color]) =>
            type !== 'DEFAULT' && (
              <div key={type} className="flex items-center gap-1.5">
                <span className={cn('h-3 w-3 rounded', color)} />
                <span className="text-xs">
                  {type === 'ANNUAL'
                    ? '연차'
                    : type === 'SICK'
                    ? '병가'
                    : type === 'PERSONAL'
                    ? '개인휴가'
                    : type === 'SPECIAL'
                    ? '특별휴가'
                    : type === 'HALF_DAY'
                    ? '반차'
                    : type}
                </span>
              </div>
            )
        )}
      </div>
    </div>
  );
}

export default GanttView;
