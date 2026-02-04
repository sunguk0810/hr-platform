import * as React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, isWeekend, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/common/DatePicker';
import { Loader2, Clock, AlertCircle } from 'lucide-react';

const overtimeSchema = z.object({
  date: z.string().min(1, '날짜를 선택해주세요'),
  overtimeType: z.enum(['WEEKDAY', 'WEEKEND', 'HOLIDAY'] as const),
  startTime: z.string().min(1, '시작 시간을 입력해주세요'),
  endTime: z.string().min(1, '종료 시간을 입력해주세요'),
  reason: z.string().min(1, '사유를 입력해주세요').max(500, '500자 이내로 입력해주세요'),
}).refine((data) => {
  if (data.startTime && data.endTime) {
    return data.startTime < data.endTime;
  }
  return true;
}, {
  message: '종료 시간은 시작 시간보다 이후여야 합니다',
  path: ['endTime'],
});

type OvertimeFormData = z.infer<typeof overtimeSchema>;

export interface OvertimeRequestFormProps {
  onSubmit: (data: OvertimeFormData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

const OVERTIME_TYPE_LABELS = {
  WEEKDAY: '평일 초과근무',
  WEEKEND: '주말 근무',
  HOLIDAY: '공휴일 근무',
};

export function OvertimeRequestForm({
  onSubmit,
  onCancel,
  isLoading = false,
}: OvertimeRequestFormProps) {
  const methods = useForm<OvertimeFormData>({
    resolver: zodResolver(overtimeSchema),
    defaultValues: {
      date: '',
      overtimeType: 'WEEKDAY',
      startTime: '18:00',
      endTime: '21:00',
      reason: '',
    },
  });

  const {
    watch,
    setValue,
    handleSubmit,
    formState: { errors },
  } = methods;

  const date = watch('date');
  const startTime = watch('startTime');
  const endTime = watch('endTime');
  const overtimeType = watch('overtimeType');

  // Calculate overtime hours
  const calculateHours = React.useMemo(() => {
    if (!startTime || !endTime) return 0;
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    return Math.max(0, (endMinutes - startMinutes) / 60);
  }, [startTime, endTime]);

  // Auto-detect overtime type based on date
  React.useEffect(() => {
    if (date) {
      const selectedDate = parseISO(date);
      if (isWeekend(selectedDate)) {
        setValue('overtimeType', 'WEEKEND');
      } else {
        setValue('overtimeType', 'WEEKDAY');
      }
    }
  }, [date, setValue]);

  const handleDateChange = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      setValue('date', format(selectedDate, 'yyyy-MM-dd'));
    }
  };

  const handleFormSubmit = async (data: OvertimeFormData) => {
    await onSubmit(data);
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Date Selection */}
        <div className="space-y-2">
          <Label>날짜 *</Label>
          <DatePicker
            value={date ? parseISO(date) : undefined}
            onChange={handleDateChange}
            placeholder="날짜 선택"
          />
          {errors.date && (
            <p className="text-sm text-destructive">{errors.date.message}</p>
          )}
        </div>

        {/* Overtime Type */}
        <div className="space-y-2">
          <Label>초과근무 유형</Label>
          <Select
            value={overtimeType}
            onValueChange={(value) => setValue('overtimeType', value as OvertimeFormData['overtimeType'])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(OVERTIME_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Time Range */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startTime">시작 시간 *</Label>
            <Input
              id="startTime"
              type="time"
              value={startTime}
              onChange={(e) => setValue('startTime', e.target.value)}
              className={errors.startTime ? 'border-destructive' : ''}
            />
            {errors.startTime && (
              <p className="text-sm text-destructive">{errors.startTime.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="endTime">종료 시간 *</Label>
            <Input
              id="endTime"
              type="time"
              value={endTime}
              onChange={(e) => setValue('endTime', e.target.value)}
              className={errors.endTime ? 'border-destructive' : ''}
            />
            {errors.endTime && (
              <p className="text-sm text-destructive">{errors.endTime.message}</p>
            )}
          </div>
        </div>

        {/* Calculated Hours */}
        {calculateHours > 0 && (
          <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg">
            <Clock className="h-5 w-5 text-primary" />
            <span className="text-sm">
              예상 초과근무 시간: <strong>{calculateHours.toFixed(1)}시간</strong>
            </span>
          </div>
        )}

        {/* Warning for long overtime */}
        {calculateHours > 4 && (
          <div className="flex items-center gap-2 p-3 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-lg">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm">
              4시간 이상의 초과근무는 추가 승인이 필요할 수 있습니다.
            </span>
          </div>
        )}

        {/* Reason */}
        <div className="space-y-2">
          <Label htmlFor="reason">사유 *</Label>
          <Textarea
            id="reason"
            {...methods.register('reason')}
            placeholder="초과근무 사유를 입력해주세요"
            rows={3}
            className={errors.reason ? 'border-destructive' : ''}
          />
          {errors.reason && (
            <p className="text-sm text-destructive">{errors.reason.message}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              취소
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                처리 중...
              </>
            ) : (
              '신청하기'
            )}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
