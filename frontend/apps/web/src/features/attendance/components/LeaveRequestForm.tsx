import * as React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, isBefore, isWeekend, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/common/DatePicker';
import { DateRangePicker, type DateRange } from '@/components/common/DateRangePicker';
import { useCreateLeaveRequest, useLeaveBalance } from '../hooks/useAttendance';
import { LEAVE_TYPE_LABELS, type LeaveType } from '@hr-platform/shared-types';
import { Loader2, CalendarDays, AlertCircle } from 'lucide-react';

const leaveRequestSchema = z.object({
  leaveType: z.enum(['ANNUAL', 'SICK', 'SPECIAL', 'HALF_DAY_AM', 'HALF_DAY_PM', 'HOURLY', 'MATERNITY', 'PATERNITY', 'UNPAID'] as const),
  startDate: z.string().min(1, '시작일을 선택해주세요'),
  endDate: z.string().min(1, '종료일을 선택해주세요'),
  reason: z.string().min(1, '사유를 입력해주세요').max(500, '500자 이내로 입력해주세요'),
  startTime: z.string().optional(), // For HOURLY leave
  endTime: z.string().optional(),   // For HOURLY leave
  hours: z.number().optional(),     // For HOURLY leave
});

type LeaveRequestFormData = z.infer<typeof leaveRequestSchema>;

export interface LeaveRequestFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const HALF_DAY_TYPES: LeaveType[] = ['HALF_DAY_AM', 'HALF_DAY_PM'];

export function LeaveRequestForm({ onSuccess, onCancel }: LeaveRequestFormProps) {
  const { data: balanceData } = useLeaveBalance();
  const createMutation = useCreateLeaveRequest();

  const methods = useForm<LeaveRequestFormData>({
    resolver: zodResolver(leaveRequestSchema),
    defaultValues: {
      leaveType: 'ANNUAL',
      startDate: '',
      endDate: '',
      reason: '',
    },
  });

  const { watch, setValue, handleSubmit, formState: { errors } } = methods;
  const leaveType = watch('leaveType');
  const startDate = watch('startDate');
  const endDate = watch('endDate');

  const isHalfDay = HALF_DAY_TYPES.includes(leaveType);

  // Calculate days
  const calculatedDays = React.useMemo(() => {
    if (!startDate || !endDate) return 0;
    if (isHalfDay) return 0.5;

    const start = parseISO(startDate);
    const end = parseISO(endDate);
    let days = 0;
    let current = start;

    while (current <= end) {
      if (!isWeekend(current)) {
        days++;
      }
      current = new Date(current.setDate(current.getDate() + 1));
    }

    return days;
  }, [startDate, endDate, isHalfDay]);

  const remainingDays = balanceData?.data?.remainingDays ?? 0;
  const isExceedingBalance = leaveType === 'ANNUAL' && calculatedDays > remainingDays;

  const handleDateRangeChange = (range: DateRange | undefined) => {
    if (range?.from) {
      setValue('startDate', format(range.from, 'yyyy-MM-dd'));
    }
    if (range?.to) {
      setValue('endDate', format(range.to, 'yyyy-MM-dd'));
    } else if (range?.from) {
      setValue('endDate', format(range.from, 'yyyy-MM-dd'));
    }
  };

  const handleSingleDateChange = (date: Date | undefined) => {
    if (date) {
      const formatted = format(date, 'yyyy-MM-dd');
      setValue('startDate', formatted);
      setValue('endDate', formatted);
    }
  };

  const onSubmit = async (data: LeaveRequestFormData) => {
    try {
      await createMutation.mutateAsync(data);
      onSuccess?.();
    } catch (error) {
      console.error('Failed to create leave request:', error);
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Leave Balance Info */}
        {balanceData?.data && (
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <CalendarDays className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm">
              사용 가능 연차: <strong>{remainingDays}일</strong>
            </span>
          </div>
        )}

        {/* Leave Type */}
        <div className="space-y-2">
          <Label htmlFor="leaveType">휴가 유형</Label>
          <Select
            value={leaveType}
            onValueChange={(value) => setValue('leaveType', value as LeaveType)}
          >
            <SelectTrigger id="leaveType">
              <SelectValue placeholder="휴가 유형 선택" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(LEAVE_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.leaveType && (
            <p className="text-sm text-destructive">{errors.leaveType.message}</p>
          )}
        </div>

        {/* Date Selection */}
        <div className="space-y-2">
          <Label>{isHalfDay ? '날짜' : '기간'}</Label>
          {isHalfDay ? (
            <DatePicker
              value={startDate ? parseISO(startDate) : undefined}
              onChange={handleSingleDateChange}
              placeholder="날짜 선택"
              disabledDates={(date) => isBefore(date, new Date()) || isWeekend(date)}
            />
          ) : (
            <DateRangePicker
              value={
                startDate && endDate
                  ? { from: parseISO(startDate), to: parseISO(endDate) }
                  : undefined
              }
              onChange={handleDateRangeChange}
              placeholder="기간 선택"
              disabledDates={(date) => isBefore(date, new Date()) || isWeekend(date)}
            />
          )}
          {(errors.startDate || errors.endDate) && (
            <p className="text-sm text-destructive">
              {errors.startDate?.message || errors.endDate?.message}
            </p>
          )}
        </div>

        {/* Calculated Days */}
        {calculatedDays > 0 && (
          <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
            <span className="text-sm">사용 일수</span>
            <span className="font-medium">{calculatedDays}일</span>
          </div>
        )}

        {/* Warning for exceeding balance */}
        {isExceedingBalance && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm">
              사용 가능한 연차({remainingDays}일)를 초과합니다.
            </span>
          </div>
        )}

        {/* Reason */}
        <div className="space-y-2">
          <Label htmlFor="reason">사유</Label>
          <Textarea
            id="reason"
            {...methods.register('reason')}
            placeholder="휴가 사유를 입력해주세요"
            rows={3}
          />
          {errors.reason && (
            <p className="text-sm text-destructive">{errors.reason.message}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              취소
            </Button>
          )}
          <Button
            type="submit"
            disabled={createMutation.isPending || (leaveType === 'ANNUAL' && isExceedingBalance)}
          >
            {createMutation.isPending ? (
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
