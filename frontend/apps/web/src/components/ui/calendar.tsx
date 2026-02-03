import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Button } from './button';

export type CalendarProps = {
  mode?: 'single' | 'range';
  selected?: Date | { from?: Date; to?: Date };
  onSelect?: (date: Date | { from?: Date; to?: Date } | undefined) => void;
  disabled?: (date: Date) => boolean;
  className?: string;
  showOutsideDays?: boolean;
  locale?: 'ko' | 'en';
};

const Calendar = React.forwardRef<HTMLDivElement, CalendarProps>(
  (
    {
      mode = 'single',
      selected,
      onSelect,
      disabled,
      className,
      showOutsideDays = true,
      locale = 'ko',
    },
    ref
  ) => {
    const [currentMonth, setCurrentMonth] = React.useState(
      mode === 'single' && selected instanceof Date
        ? startOfMonth(selected)
        : mode === 'range' && selected && 'from' in selected && selected.from
          ? startOfMonth(selected.from)
          : startOfMonth(new Date())
    );

    const [rangeStart, setRangeStart] = React.useState<Date | undefined>(
      mode === 'range' && selected && 'from' in selected ? selected.from : undefined
    );

    const weekDays = locale === 'ko'
      ? ['일', '월', '화', '수', '목', '금', '토']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    const days: Date[] = [];
    let day = calendarStart;
    while (day <= calendarEnd) {
      days.push(day);
      day = addDays(day, 1);
    }

    const handlePrevMonth = () => {
      setCurrentMonth(subMonths(currentMonth, 1));
    };

    const handleNextMonth = () => {
      setCurrentMonth(addMonths(currentMonth, 1));
    };

    const handleDateClick = (date: Date) => {
      if (disabled?.(date)) return;

      if (mode === 'single') {
        onSelect?.(date);
      } else if (mode === 'range') {
        if (!rangeStart) {
          setRangeStart(date);
          onSelect?.({ from: date, to: undefined });
        } else {
          if (date < rangeStart) {
            setRangeStart(date);
            onSelect?.({ from: date, to: undefined });
          } else {
            onSelect?.({ from: rangeStart, to: date });
            setRangeStart(undefined);
          }
        }
      }
    };

    const isSelected = (date: Date) => {
      if (mode === 'single' && selected instanceof Date) {
        return isSameDay(date, selected);
      }
      if (mode === 'range' && selected && 'from' in selected) {
        if (selected.from && selected.to) {
          return date >= selected.from && date <= selected.to;
        }
        if (selected.from) {
          return isSameDay(date, selected.from);
        }
      }
      return false;
    };

    const isRangeStart = (date: Date) => {
      if (mode === 'range' && selected && 'from' in selected && selected.from) {
        return isSameDay(date, selected.from);
      }
      return false;
    };

    const isRangeEnd = (date: Date) => {
      if (mode === 'range' && selected && 'from' in selected && selected.to) {
        return isSameDay(date, selected.to);
      }
      return false;
    };

    return (
      <div ref={ref} className={cn('p-3', className)}>
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={handlePrevMonth}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="font-semibold">
            {format(currentMonth, locale === 'ko' ? 'yyyy년 M월' : 'MMMM yyyy', {
              locale: locale === 'ko' ? ko : undefined,
            })}
          </div>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={handleNextMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((dayName) => (
            <div
              key={dayName}
              className="text-center text-xs font-medium text-muted-foreground py-1"
            >
              {dayName}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((date, index) => {
            const isOutsideMonth = !isSameMonth(date, currentMonth);
            const isDateDisabled = disabled?.(date);
            const isDateSelected = isSelected(date);
            const isDateToday = isToday(date);
            const isStart = isRangeStart(date);
            const isEnd = isRangeEnd(date);

            if (!showOutsideDays && isOutsideMonth) {
              return <div key={index} />;
            }

            return (
              <button
                key={index}
                type="button"
                disabled={isDateDisabled}
                onClick={() => handleDateClick(date)}
                className={cn(
                  'h-9 w-9 text-center text-sm p-0 font-normal rounded-md transition-colors',
                  'hover:bg-accent hover:text-accent-foreground',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isOutsideMonth && 'text-muted-foreground opacity-50',
                  isDateToday && 'bg-accent text-accent-foreground',
                  isDateSelected && 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
                  isStart && 'rounded-r-none',
                  isEnd && 'rounded-l-none',
                  isDateSelected && !isStart && !isEnd && mode === 'range' && 'rounded-none bg-primary/20 text-primary-foreground hover:bg-primary/30',
                  isDateDisabled && 'opacity-50 cursor-not-allowed hover:bg-transparent'
                )}
              >
                {format(date, 'd')}
              </button>
            );
          })}
        </div>
      </div>
    );
  }
);
Calendar.displayName = 'Calendar';

export { Calendar };
