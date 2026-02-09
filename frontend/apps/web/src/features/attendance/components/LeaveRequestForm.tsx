import * as React from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
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

function createLeaveRequestSchema(t: TFunction) {
  return z.object({
    leaveType: z.enum(['ANNUAL', 'SICK', 'SPECIAL', 'HALF_DAY_AM', 'HALF_DAY_PM', 'HOURLY', 'MATERNITY', 'PATERNITY', 'UNPAID'] as const),
    startDate: z.string().min(1, t('validation.startDateRequired')),
    endDate: z.string().min(1, t('validation.endDateRequired')),
    reason: z.string().min(1, t('validation.reasonRequired')).max(500, t('validation.reasonMaxLength')),
    startTime: z.string().optional(), // For HOURLY leave
    endTime: z.string().optional(),   // For HOURLY leave
    hours: z.number().optional(),     // For HOURLY leave
  });
}

type LeaveRequestFormData = z.infer<ReturnType<typeof createLeaveRequestSchema>>;

export interface LeaveRequestFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const HALF_DAY_TYPES: LeaveType[] = ['HALF_DAY_AM', 'HALF_DAY_PM'];

export function LeaveRequestForm({ onSuccess, onCancel }: LeaveRequestFormProps) {
  const { t } = useTranslation('attendance');
  const { data: balanceData } = useLeaveBalance();
  const createMutation = useCreateLeaveRequest();
  const leaveRequestSchema = React.useMemo(() => createLeaveRequestSchema(t), [t]);

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
              {t('components.leaveRequestForm.availableAnnual', { count: remainingDays })}
            </span>
          </div>
        )}

        {/* Leave Type */}
        <div className="space-y-2">
          <Label htmlFor="leaveType">{t('components.leaveRequestForm.leaveTypeLabel')}</Label>
          <Select
            value={leaveType}
            onValueChange={(value) => setValue('leaveType', value as LeaveType)}
          >
            <SelectTrigger id="leaveType">
              <SelectValue placeholder={t('components.leaveRequestForm.leaveTypePlaceholder')} />
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
          <Label>{isHalfDay ? t('components.leaveRequestForm.dateLabel') : t('components.leaveRequestForm.periodLabel')}</Label>
          {isHalfDay ? (
            <DatePicker
              value={startDate ? parseISO(startDate) : undefined}
              onChange={handleSingleDateChange}
              placeholder={t('components.leaveRequestForm.datePlaceholder')}
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
              placeholder={t('components.leaveRequestForm.periodPlaceholder')}
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
            <span className="text-sm">{t('components.leaveRequestForm.usageDays')}</span>
            <span className="font-medium">{t('components.leaveRequestForm.daysUnit', { count: calculatedDays })}</span>
          </div>
        )}

        {/* Warning for exceeding balance */}
        {isExceedingBalance && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm">
              {t('components.leaveRequestForm.exceedingBalance', { count: remainingDays })}
            </span>
          </div>
        )}

        {/* Reason */}
        <div className="space-y-2">
          <Label htmlFor="reason">{t('components.leaveRequestForm.reasonLabel')}</Label>
          <Textarea
            id="reason"
            {...methods.register('reason')}
            placeholder={t('components.leaveRequestForm.reasonPlaceholder')}
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
              {t('common:cancel')}
            </Button>
          )}
          <Button
            type="submit"
            disabled={createMutation.isPending || (leaveType === 'ANNUAL' && isExceedingBalance)}
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('components.checkInOutButton.processing')}
              </>
            ) : (
              t('components.leaveRequestForm.submit')
            )}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
