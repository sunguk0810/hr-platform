import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { FormRow } from '@/components/common/Form';
import { Loader2, Clock, Timer, AlertCircle } from 'lucide-react';
import type { AttendancePolicy } from '@hr-platform/shared-types';
import { DEFAULT_ATTENDANCE_POLICY } from '@hr-platform/shared-types';

const attendancePolicySchema = z.object({
  workHours: z.object({
    standardHoursPerDay: z.number().min(1).max(12),
    standardHoursPerWeek: z.number().min(1).max(60),
    maxHoursPerWeek: z.number().min(1).max(80),
    flexTimeEnabled: z.boolean(),
  }),
  coreTime: z.object({
    enabled: z.boolean(),
    start: z.string().regex(/^\d{2}:\d{2}$/, '시간 형식: HH:mm'),
    end: z.string().regex(/^\d{2}:\d{2}$/, '시간 형식: HH:mm'),
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
              근무 시간 설정
            </CardTitle>
            <CardDescription>일/주 표준 근무시간 및 유연근무 설정</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormRow cols={3}>
              <div className="space-y-2">
                <Label>일 표준 근무시간</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    {...register('workHours.standardHoursPerDay', { valueAsNumber: true })}
                    disabled={readOnly}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">시간</span>
                </div>
                {errors.workHours?.standardHoursPerDay && (
                  <p className="text-sm text-destructive">
                    {errors.workHours.standardHoursPerDay.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>주 표준 근무시간</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    {...register('workHours.standardHoursPerWeek', { valueAsNumber: true })}
                    disabled={readOnly}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">시간</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>주 최대 근무시간</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    {...register('workHours.maxHoursPerWeek', { valueAsNumber: true })}
                    disabled={readOnly}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">시간</span>
                </div>
              </div>
            </FormRow>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label>유연근무제</Label>
                <p className="text-sm text-muted-foreground">
                  시차출퇴근 허용 (핵심시간 내 근무 필수)
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
              핵심 시간 설정
            </CardTitle>
            <CardDescription>유연근무 시 필수 근무해야 하는 핵심 시간대</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label>핵심 시간 활성화</Label>
                <p className="text-sm text-muted-foreground">
                  지정된 시간대에는 반드시 근무해야 합니다
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
                  <Label>핵심 시간 시작</Label>
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
                  <Label>핵심 시간 종료</Label>
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
              연장 근무 설정
            </CardTitle>
            <CardDescription>초과근무 신청 및 자동계산 설정</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label>연장근무 승인 필요</Label>
                <p className="text-sm text-muted-foreground">
                  연장근무 시 사전 결재 승인이 필요합니다
                </p>
              </div>
              <Switch
                checked={watch('overtime.requiresApproval')}
                onCheckedChange={(checked) => setValue('overtime.requiresApproval', checked)}
                disabled={readOnly}
              />
            </div>

            <div className="space-y-2">
              <Label>월 최대 연장근무 시간</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  {...register('overtime.maxHoursPerMonth', { valueAsNumber: true })}
                  disabled={readOnly}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">시간</span>
              </div>
              {errors.overtime?.maxHoursPerMonth && (
                <p className="text-sm text-destructive">
                  {errors.overtime.maxHoursPerMonth.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label>연장근무 자동 계산</Label>
                <p className="text-sm text-muted-foreground">
                  표준 근무시간 초과분을 자동으로 연장근무로 계산
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
              지각 정책
            </CardTitle>
            <CardDescription>지각 유예 시간 및 페널티 설정</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>지각 유예 시간</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  {...register('latePolicy.gracePeriodMinutes', { valueAsNumber: true })}
                  disabled={readOnly}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">분</span>
              </div>
              <p className="text-sm text-muted-foreground">
                출근 시간 이후 유예 시간까지는 지각으로 처리하지 않습니다
              </p>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label>지각 페널티 활성화</Label>
                <p className="text-sm text-muted-foreground">
                  지각 시 연차 차감 또는 급여 차감 적용
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
                  저장 중...
                </>
              ) : (
                '저장'
              )}
            </Button>
          </div>
        )}
      </form>
    </FormProvider>
  );
}
