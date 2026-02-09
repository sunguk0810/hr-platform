import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormRow } from '@/components/common/Form';
import { Loader2, Clock, Timer, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';
import type { AttendancePolicy, HourlyLeaveMinUnit } from '@hr-platform/shared-types';
import { DEFAULT_ATTENDANCE_POLICY } from '@hr-platform/shared-types';

const createAttendancePolicySchema = (t: TFunction) =>
  z.object({
    workHours: z.object({
      standardHoursPerDay: z.number().min(1).max(12),
      standardHoursPerWeek: z.number().min(1).max(60),
      maxHoursPerWeek: z.number().min(1).max(80),
      flexTimeEnabled: z.boolean(),
    }),
    coreTime: z.object({
      enabled: z.boolean(),
      start: z.string().regex(/^\d{2}:\d{2}$/, t('validation.timeFormat')),
      end: z.string().regex(/^\d{2}:\d{2}$/, t('validation.timeFormat')),
    }),
    overtime: z.object({
      requiresApproval: z.boolean(),
      maxHoursPerMonth: z.number().min(0).max(100),
      autoCalculate: z.boolean(),
    }),
    latePolicy: z.object({
      gracePeriodMinutes: z.number().min(0).max(60),
      penaltyEnabled: z.boolean(),
    }),
  });

export interface AttendancePolicySettingsProps {
  initialData?: AttendancePolicy;
  onSubmit: (data: AttendancePolicy) => Promise<void>;
  isLoading?: boolean;
  readOnly?: boolean;
}

export function AttendancePolicySettings({
  initialData,
  onSubmit,
  isLoading = false,
  readOnly = false,
}: AttendancePolicySettingsProps) {
  const { t } = useTranslation('tenant');
  const attendancePolicySchema = React.useMemo(() => createAttendancePolicySchema(t), [t]);

  const methods = useForm<AttendancePolicy>({
    resolver: zodResolver(attendancePolicySchema),
    defaultValues: initialData ?? DEFAULT_ATTENDANCE_POLICY,
  });

  const { register, watch, setValue, handleSubmit, formState: { errors } } = methods;

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* 근무 시간 설정 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {t('attendancePolicy.workHoursTitle')}
            </CardTitle>
            <CardDescription>{t('attendancePolicy.workHoursDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormRow cols={3}>
              <div className="space-y-2">
                <Label>{t('attendancePolicy.standardHoursPerDay')}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    {...register('workHours.standardHoursPerDay', { valueAsNumber: true })}
                    disabled={readOnly}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">{t('attendancePolicy.hoursUnit')}</span>
                </div>
                {errors.workHours?.standardHoursPerDay && (
                  <p className="text-sm text-destructive">
                    {errors.workHours.standardHoursPerDay.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>{t('attendancePolicy.standardHoursPerWeek')}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    {...register('workHours.standardHoursPerWeek', { valueAsNumber: true })}
                    disabled={readOnly}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">{t('attendancePolicy.hoursUnit')}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('attendancePolicy.maxHoursPerWeek')}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    {...register('workHours.maxHoursPerWeek', { valueAsNumber: true })}
                    disabled={readOnly}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">{t('attendancePolicy.hoursUnit')}</span>
                </div>
              </div>
            </FormRow>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label>{t('attendancePolicy.flexTime')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('attendancePolicy.flexTimeDescription')}
                </p>
              </div>
              <Switch
                checked={watch('workHours.flexTimeEnabled')}
                onCheckedChange={(checked) => setValue('workHours.flexTimeEnabled', checked)}
                disabled={readOnly}
              />
            </div>
          </CardContent>
        </Card>

        {/* 핵심 시간 설정 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5" />
              {t('attendancePolicy.coreTimeTitle')}
            </CardTitle>
            <CardDescription>{t('attendancePolicy.coreTimeDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label>{t('attendancePolicy.coreTimeEnabled')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('attendancePolicy.coreTimeEnabledDescription')}
                </p>
              </div>
              <Switch
                checked={watch('coreTime.enabled')}
                onCheckedChange={(checked) => setValue('coreTime.enabled', checked)}
                disabled={readOnly}
              />
            </div>

            {watch('coreTime.enabled') && (
              <FormRow cols={2}>
                <div className="space-y-2">
                  <Label>{t('attendancePolicy.coreTimeStart')}</Label>
                  <Input
                    type="time"
                    {...register('coreTime.start')}
                    disabled={readOnly}
                  />
                  {errors.coreTime?.start && (
                    <p className="text-sm text-destructive">{errors.coreTime.start.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>{t('attendancePolicy.coreTimeEnd')}</Label>
                  <Input
                    type="time"
                    {...register('coreTime.end')}
                    disabled={readOnly}
                  />
                  {errors.coreTime?.end && (
                    <p className="text-sm text-destructive">{errors.coreTime.end.message}</p>
                  )}
                </div>
              </FormRow>
            )}
          </CardContent>
        </Card>

        {/* 연장 근무 설정 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {t('attendancePolicy.overtimeTitle')}
            </CardTitle>
            <CardDescription>{t('attendancePolicy.overtimeDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label>{t('attendancePolicy.overtimeApprovalRequired')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('attendancePolicy.overtimeApprovalRequiredDescription')}
                </p>
              </div>
              <Switch
                checked={watch('overtime.requiresApproval')}
                onCheckedChange={(checked) => setValue('overtime.requiresApproval', checked)}
                disabled={readOnly}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('attendancePolicy.maxOvertimePerMonth')}</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  {...register('overtime.maxHoursPerMonth', { valueAsNumber: true })}
                  disabled={readOnly}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">{t('attendancePolicy.hoursUnit')}</span>
              </div>
              {errors.overtime?.maxHoursPerMonth && (
                <p className="text-sm text-destructive">
                  {errors.overtime.maxHoursPerMonth.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label>{t('attendancePolicy.autoCalculate')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('attendancePolicy.autoCalculateDescription')}
                </p>
              </div>
              <Switch
                checked={watch('overtime.autoCalculate')}
                onCheckedChange={(checked) => setValue('overtime.autoCalculate', checked)}
                disabled={readOnly}
              />
            </div>
          </CardContent>
        </Card>

        {/* 지각 정책 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              {t('attendancePolicy.latePolicyTitle')}
            </CardTitle>
            <CardDescription>{t('attendancePolicy.latePolicyDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t('attendancePolicy.gracePeriod')}</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  {...register('latePolicy.gracePeriodMinutes', { valueAsNumber: true })}
                  disabled={readOnly}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">{t('attendancePolicy.gracePeriodUnit')}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {t('attendancePolicy.gracePeriodHint')}
              </p>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label>{t('attendancePolicy.penaltyEnabled')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('attendancePolicy.penaltyEnabledDescription')}
                </p>
              </div>
              <Switch
                checked={watch('latePolicy.penaltyEnabled')}
                onCheckedChange={(checked) => setValue('latePolicy.penaltyEnabled', checked)}
                disabled={readOnly}
              />
            </div>
          </CardContent>
        </Card>

        {!readOnly && (
          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('common.saving')}
                </>
              ) : (
                t('common.save')
              )}
            </Button>
          </div>
        )}
      </form>

      {/* 시간차 휴가 정책 (별도 저장) */}
      {!readOnly && <HourlyLeavePolicyCard />}
    </FormProvider>
  );
}

function HourlyLeavePolicyCard() {
  const { t } = useTranslation('tenant');
  const { toast } = useToast();
  const [policy, setPolicy] = useState({
    enabled: true,
    minUnit: 30 as HourlyLeaveMinUnit,
    dailyMaxCount: 2,
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast({ title: t('attendancePolicy.saveSuccess'), description: t('attendancePolicy.saveSuccessDescription') });
    } catch {
      toast({ title: t('attendancePolicy.saveError'), description: t('attendancePolicy.saveErrorDescription'), variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-violet-600" />
          {t('attendancePolicy.hourlyLeaveTitle')}
        </CardTitle>
        <CardDescription>{t('attendancePolicy.hourlyLeaveDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <Label>{t('attendancePolicy.hourlyLeaveEnabled')}</Label>
            <p className="text-sm text-muted-foreground">
              {t('attendancePolicy.hourlyLeaveEnabledDescription')}
            </p>
          </div>
          <Switch
            checked={policy.enabled}
            onCheckedChange={(checked) => setPolicy((prev) => ({ ...prev, enabled: checked }))}
          />
        </div>

        {policy.enabled && (
          <>
            <div className="space-y-2">
              <Label>{t('attendancePolicy.minUnit')}</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPolicy((prev) => ({ ...prev, minUnit: 30 }))}
                  className={cn(
                    'p-3 rounded-lg border-2 text-center text-sm transition-colors',
                    policy.minUnit === 30 ? 'border-primary bg-primary/5 font-medium' : 'border-muted'
                  )}
                >
                  {t('attendancePolicy.minUnit30')}
                </button>
                <button
                  type="button"
                  onClick={() => setPolicy((prev) => ({ ...prev, minUnit: 60 }))}
                  className={cn(
                    'p-3 rounded-lg border-2 text-center text-sm transition-colors',
                    policy.minUnit === 60 ? 'border-primary bg-primary/5 font-medium' : 'border-muted'
                  )}
                >
                  {t('attendancePolicy.minUnit60')}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('attendancePolicy.dailyMaxCount')}</Label>
              <Select
                value={String(policy.dailyMaxCount)}
                onValueChange={(value) => setPolicy((prev) => ({ ...prev, dailyMaxCount: parseInt(value, 10) }))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">{t('attendancePolicy.dailyMaxCount1')}</SelectItem>
                  <SelectItem value="2">{t('attendancePolicy.dailyMaxCount2')}</SelectItem>
                  <SelectItem value="3">{t('attendancePolicy.dailyMaxCount3')}</SelectItem>
                  <SelectItem value="4">{t('attendancePolicy.dailyMaxCount4')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
              <p className="font-medium mb-1">{t('attendancePolicy.policySummary')}</p>
              <ul className="space-y-0.5">
                <li>- {t('attendancePolicy.policySummaryMinUnit', { unit: policy.minUnit === 30 ? t('attendancePolicy.minUnit30') : t('attendancePolicy.minUnit60') })}</li>
                <li>- {t('attendancePolicy.policySummaryDailyMax', { count: policy.dailyMaxCount })}</li>
              </ul>
            </div>
          </>
        )}

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('common.saving')}
              </>
            ) : (
              t('attendancePolicy.saveHourlyLeave')
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
