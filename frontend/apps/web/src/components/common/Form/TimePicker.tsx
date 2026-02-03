import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Clock } from 'lucide-react';

export interface TimePickerProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minTime?: string;
  maxTime?: string;
  step?: number;
  format?: '12h' | '24h';
  className?: string;
}

const HOURS_24 = Array.from({ length: 24 }, (_, i) =>
  String(i).padStart(2, '0')
);
const MINUTES = Array.from({ length: 60 }, (_, i) =>
  String(i).padStart(2, '0')
);

export function TimePicker({
  value,
  onChange,
  placeholder = '시간 선택',
  disabled = false,
  minTime,
  maxTime,
  step = 5,
  format = '24h',
  className,
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [hour, setHour] = React.useState<string>('');
  const [minute, setMinute] = React.useState<string>('');

  React.useEffect(() => {
    if (value) {
      const [h, m] = value.split(':');
      setHour(h || '');
      setMinute(m || '');
    }
  }, [value]);

  const filteredMinutes = React.useMemo(() => {
    return MINUTES.filter((m) => Number(m) % step === 0);
  }, [step]);

  const isTimeDisabled = React.useCallback(
    (h: string, m: string) => {
      const time = `${h}:${m}`;
      if (minTime && time < minTime) return true;
      if (maxTime && time > maxTime) return true;
      return false;
    },
    [minTime, maxTime]
  );

  const handleSelect = (h: string, m: string) => {
    if (isTimeDisabled(h, m)) return;
    setHour(h);
    setMinute(m);
    onChange?.(`${h}:${m}`);
    setOpen(false);
  };

  const formatDisplayValue = (timeValue: string | undefined) => {
    if (!timeValue) return null;
    if (format === '24h') return timeValue;

    const [h, m] = timeValue.split(':');
    const hour24 = Number(h);
    const period = hour24 >= 12 ? 'PM' : 'AM';
    const hour12 = hour24 % 12 || 12;
    return `${hour12}:${m} ${period}`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-start text-left font-normal',
            !value && 'text-muted-foreground',
            className
          )}
        >
          <Clock className="mr-2 h-4 w-4" />
          {value ? formatDisplayValue(value) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex p-2 gap-1">
          <div className="flex flex-col">
            <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
              시
            </div>
            <div className="h-[200px] overflow-y-auto scrollbar-thin">
              {HOURS_24.map((h) => (
                <Button
                  key={h}
                  variant={hour === h ? 'default' : 'ghost'}
                  size="sm"
                  className={cn(
                    'w-10 h-8 justify-center',
                    isTimeDisabled(h, minute || '00') && 'opacity-50'
                  )}
                  onClick={() => handleSelect(h, minute || '00')}
                  disabled={isTimeDisabled(h, minute || '00')}
                >
                  {h}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex flex-col">
            <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
              분
            </div>
            <div className="h-[200px] overflow-y-auto scrollbar-thin">
              {filteredMinutes.map((m) => (
                <Button
                  key={m}
                  variant={minute === m ? 'default' : 'ghost'}
                  size="sm"
                  className={cn(
                    'w-10 h-8 justify-center',
                    isTimeDisabled(hour || '00', m) && 'opacity-50'
                  )}
                  onClick={() => handleSelect(hour || '00', m)}
                  disabled={isTimeDisabled(hour || '00', m)}
                >
                  {m}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export interface TimeInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function TimeInput({
  value,
  onChange,
  placeholder = 'HH:MM',
  disabled = false,
  className,
}: TimeInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value.replace(/[^\d]/g, '');

    if (input.length > 4) {
      input = input.slice(0, 4);
    }

    if (input.length >= 3) {
      input = input.slice(0, 2) + ':' + input.slice(2);
    }

    const [h, m] = input.split(':');
    if (h && Number(h) > 23) {
      input = '23' + (m ? ':' + m : '');
    }
    if (m && Number(m) > 59) {
      input = h + ':59';
    }

    onChange?.(input);
  };

  return (
    <div className="relative">
      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        value={value || ''}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className={cn('pl-9', className)}
        maxLength={5}
      />
    </div>
  );
}
