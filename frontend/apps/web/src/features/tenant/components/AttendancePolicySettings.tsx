import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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

      {/* 시간차 휴가 정책 (별도 저장) */}
      {!readOnly && <HourlyLeavePolicyCard />}
    </FormProvider>
  );
}

function HourlyLeavePolicyCard() {
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
      toast({ title: '저장 완료', description: '시간차 휴가 정책이 저장되었습니다.' });
    } catch {
      toast({ title: '저장 실패', description: '시간차 휴가 정책 저장에 실패했습니다.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-violet-600" />
          시간차 휴가 정책
        </CardTitle>
        <CardDescription>시간차 휴가(시간 단위 연차)의 사용 정책을 설정합니다.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <Label>시간차 휴가 사용</Label>
            <p className="text-sm text-muted-foreground">
              활성화하면 직원이 시간 단위로 휴가를 신청할 수 있습니다.
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
              <Label>최소 사용 단위</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPolicy((prev) => ({ ...prev, minUnit: 30 }))}
                  className={cn(
                    'p-3 rounded-lg border-2 text-center text-sm transition-colors',
                    policy.minUnit === 30 ? 'border-primary bg-primary/5 font-medium' : 'border-muted'
                  )}
                >
                  30분
                </button>
                <button
                  type="button"
                  onClick={() => setPolicy((prev) => ({ ...prev, minUnit: 60 }))}
                  className={cn(
                    'p-3 rounded-lg border-2 text-center text-sm transition-colors',
                    policy.minUnit === 60 ? 'border-primary bg-primary/5 font-medium' : 'border-muted'
                  )}
                >
                  1시간
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>일일 최대 사용 횟수</Label>
              <Select
                value={String(policy.dailyMaxCount)}
                onValueChange={(value) => setPolicy((prev) => ({ ...prev, dailyMaxCount: parseInt(value, 10) }))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1회</SelectItem>
                  <SelectItem value="2">2회</SelectItem>
                  <SelectItem value="3">3회</SelectItem>
                  <SelectItem value="4">4회</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
              <p className="font-medium mb-1">현재 정책 요약</p>
              <ul className="space-y-0.5">
                <li>- 최소 단위: {policy.minUnit === 30 ? '30분' : '1시간'}</li>
                <li>- 일일 최대: {policy.dailyMaxCount}회</li>
              </ul>
            </div>
          </>
        )}

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                저장 중...
              </>
            ) : (
              '시간차 휴가 정책 저장'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
