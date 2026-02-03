import * as React from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export interface DateRange {
  from?: Date;
  to?: Date;
}

export interface DateRangePickerProps {
  value?: DateRange;
  onChange?: (range: DateRange | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  disabledDates?: (date: Date) => boolean;
  locale?: 'ko' | 'en';
  className?: string;
}

export function DateRangePicker({
  value,
  onChange,
  placeholder = '기간 선택',
  disabled = false,
  disabledDates,
  locale = 'ko',
  className,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (date: Date | { from?: Date; to?: Date } | undefined) => {
    if (date && typeof date === 'object' && 'from' in date) {
      onChange?.(date);
      if (date.from && date.to) {
        setOpen(false);
      }
    }
  };

  const formatDate = (date: Date) => {
    return format(date, locale === 'ko' ? 'yyyy.M.d' : 'MMM d, yyyy', {
      locale: locale === 'ko' ? ko : undefined,
    });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-start text-left font-normal',
            !value?.from && 'text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value?.from ? (
            value.to ? (
              <>
                {formatDate(value.from)} - {formatDate(value.to)}
              </>
            ) : (
              formatDate(value.from)
            )
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={value}
          onSelect={handleSelect}
          disabled={disabledDates}
          locale={locale}
        />
      </PopoverContent>
    </Popover>
  );
}
