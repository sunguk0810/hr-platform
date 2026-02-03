import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { FormRow } from '@/components/common/Form';
import { Loader2, Calendar, Clock, FileCheck } from 'lucide-react';
import type { TenantPolicies, LeavePolicy, AttendancePolicy, ApprovalPolicy } from '@hr-platform/shared-types';

const policiesSchema = z.object({
  maxEmployees: z.number().min(1),
  maxDepartments: z.number().min(1),
  allowedModules: z.array(z.string()),
  leavePolicy: z.object({
    annualLeaveBaseDays: z.number().min(0).max(30),
    annualLeaveIncrement: z.number().min(0).max(5),
    maxAnnualLeave: z.number().min(0).max(40),
    sickLeaveDays: z.number().min(0),
    specialLeaveDays: z.number().min(0),
    carryOverEnabled: z.boolean(),
    carryOverMaxDays: z.number().min(0),
    carryOverExpiryMonths: z.number().min(1).max(12),
  }),
  attendancePolicy: z.object({
    workStartTime: z.string(),
    workEndTime: z.string(),
    lateGraceMinutes: z.number().min(0).max(60),
    earlyLeaveGraceMinutes: z.number().min(0).max(60),
    requiredWorkHours: z.number().min(1).max(12),
    overtimeEnabled: z.boolean(),
    flexibleTimeEnabled: z.boolean(),
  }),
  approvalPolicy: z.object({
    maxApprovalSteps: z.number().min(1).max(10),
    autoApprovalEnabled: z.boolean(),
    autoApprovalDays: z.number().min(1).max(30),
    parallelApprovalEnabled: z.boolean(),
  }),
});

type PoliciesFormData = z.infer<typeof policiesSchema>;

export interface PolicySettingsProps {
  initialData?: Partial<TenantPolicies>;
  onSubmit?: (data: TenantPolicies) => Promise<void>;
  isLoading?: boolean;
  readOnly?: boolean;
}

const defaultLeavePolicy: LeavePolicy = {
  annualLeaveBaseDays: 15,
  annualLeaveIncrement: 1,
  maxAnnualLeave: 25,
  sickLeaveDays: 3,
  specialLeaveDays: 5,
  carryOverEnabled: true,
  carryOverMaxDays: 5,
  carryOverExpiryMonths: 3,
};

const defaultAttendancePolicy: AttendancePolicy = {
  workStartTime: '09:00',
  workEndTime: '18:00',
  lateGraceMinutes: 10,
  earlyLeaveGraceMinutes: 10,
  requiredWorkHours: 8,
  overtimeEnabled: true,
  flexibleTimeEnabled: false,
};

const defaultApprovalPolicy: ApprovalPolicy = {
  maxApprovalSteps: 5,
  autoApprovalEnabled: false,
  autoApprovalDays: 7,
  parallelApprovalEnabled: false,
};

export function PolicySettings({
  initialData,
  onSubmit,
  isLoading = false,
  readOnly = false,
}: PolicySettingsProps) {
  const methods = useForm<PoliciesFormData>({
    resolver: zodResolver(policiesSchema),
    defaultValues: {
      maxEmployees: initialData?.maxEmployees ?? 100,
      maxDepartments: initialData?.maxDepartments ?? 20,
      allowedModules: initialData?.allowedModules ?? [],
      leavePolicy: { ...defaultLeavePolicy, ...initialData?.leavePolicy },
      attendancePolicy: { ...defaultAttendancePolicy, ...initialData?.attendancePolicy },
      approvalPolicy: { ...defaultApprovalPolicy, ...initialData?.approvalPolicy },
    },
  });

  const { register, watch, setValue, handleSubmit } = methods;

  const handleFormSubmit = async (data: PoliciesFormData) => {
    await onSubmit?.(data as TenantPolicies);
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Leave Policy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              휴가 정책
            </CardTitle>
            <CardDescription>연차 및 각종 휴가 관련 설정</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormRow cols={3}>
              <div className="space-y-2">
                <Label>기본 연차 일수</Label>
                <Input
                  type="number"
                  {...register('leavePolicy.annualLeaveBaseDays', { valueAsNumber: true })}
                  disabled={readOnly}
                />
              </div>
              <div className="space-y-2">
                <Label>연차 증가분 (년)</Label>
                <Input
                  type="number"
                  {...register('leavePolicy.annualLeaveIncrement', { valueAsNumber: true })}
                  disabled={readOnly}
                />
              </div>
              <div className="space-y-2">
                <Label>최대 연차 일수</Label>
                <Input
                  type="number"
                  {...register('leavePolicy.maxAnnualLeave', { valueAsNumber: true })}
                  disabled={readOnly}
                />
              </div>
            </FormRow>
            <FormRow cols={2}>
              <div className="space-y-2">
                <Label>병가 일수</Label>
                <Input
                  type="number"
                  {...register('leavePolicy.sickLeaveDays', { valueAsNumber: true })}
                  disabled={readOnly}
                />
              </div>
              <div className="space-y-2">
                <Label>특별휴가 일수</Label>
                <Input
                  type="number"
                  {...register('leavePolicy.specialLeaveDays', { valueAsNumber: true })}
                  disabled={readOnly}
                />
              </div>
            </FormRow>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label>이월 허용</Label>
                <p className="text-sm text-muted-foreground">미사용 연차 이월 허용</p>
              </div>
              <Switch
                checked={watch('leavePolicy.carryOverEnabled')}
                onCheckedChange={(checked) => setValue('leavePolicy.carryOverEnabled', checked)}
                disabled={readOnly}
              />
            </div>
            {watch('leavePolicy.carryOverEnabled') && (
              <FormRow cols={2}>
                <div className="space-y-2">
                  <Label>최대 이월 일수</Label>
                  <Input
                    type="number"
                    {...register('leavePolicy.carryOverMaxDays', { valueAsNumber: true })}
                    disabled={readOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label>이월 만료 기간 (개월)</Label>
                  <Input
                    type="number"
                    {...register('leavePolicy.carryOverExpiryMonths', { valueAsNumber: true })}
                    disabled={readOnly}
                  />
                </div>
              </FormRow>
            )}
          </CardContent>
        </Card>

        {/* Attendance Policy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              근태 정책
            </CardTitle>
            <CardDescription>출퇴근 및 근무 시간 설정</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormRow cols={3}>
              <div className="space-y-2">
                <Label>출근 시간</Label>
                <Input
                  type="time"
                  {...register('attendancePolicy.workStartTime')}
                  disabled={readOnly}
                />
              </div>
              <div className="space-y-2">
                <Label>퇴근 시간</Label>
                <Input
                  type="time"
                  {...register('attendancePolicy.workEndTime')}
                  disabled={readOnly}
                />
              </div>
              <div className="space-y-2">
                <Label>필수 근무시간</Label>
                <Input
                  type="number"
                  {...register('attendancePolicy.requiredWorkHours', { valueAsNumber: true })}
                  disabled={readOnly}
                />
              </div>
            </FormRow>
            <FormRow cols={2}>
              <div className="space-y-2">
                <Label>지각 유예 (분)</Label>
                <Input
                  type="number"
                  {...register('attendancePolicy.lateGraceMinutes', { valueAsNumber: true })}
                  disabled={readOnly}
                />
              </div>
              <div className="space-y-2">
                <Label>조퇴 유예 (분)</Label>
                <Input
                  type="number"
                  {...register('attendancePolicy.earlyLeaveGraceMinutes', { valueAsNumber: true })}
                  disabled={readOnly}
                />
              </div>
            </FormRow>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label>초과근무 허용</Label>
                  <p className="text-sm text-muted-foreground">연장근무 신청 기능 활성화</p>
                </div>
                <Switch
                  checked={watch('attendancePolicy.overtimeEnabled')}
                  onCheckedChange={(checked) => setValue('attendancePolicy.overtimeEnabled', checked)}
                  disabled={readOnly}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label>유연근무제</Label>
                  <p className="text-sm text-muted-foreground">시차출퇴근 허용</p>
                </div>
                <Switch
                  checked={watch('attendancePolicy.flexibleTimeEnabled')}
                  onCheckedChange={(checked) => setValue('attendancePolicy.flexibleTimeEnabled', checked)}
                  disabled={readOnly}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Approval Policy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              결재 정책
            </CardTitle>
            <CardDescription>전자결재 워크플로우 설정</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>최대 결재 단계</Label>
              <Input
                type="number"
                {...register('approvalPolicy.maxApprovalSteps', { valueAsNumber: true })}
                disabled={readOnly}
                className="w-32"
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label>자동 승인</Label>
                  <p className="text-sm text-muted-foreground">기한 초과 시 자동 승인 처리</p>
                </div>
                <Switch
                  checked={watch('approvalPolicy.autoApprovalEnabled')}
                  onCheckedChange={(checked) => setValue('approvalPolicy.autoApprovalEnabled', checked)}
                  disabled={readOnly}
                />
              </div>
              {watch('approvalPolicy.autoApprovalEnabled') && (
                <div className="space-y-2 pl-4">
                  <Label>자동 승인 기한 (일)</Label>
                  <Input
                    type="number"
                    {...register('approvalPolicy.autoApprovalDays', { valueAsNumber: true })}
                    disabled={readOnly}
                    className="w-32"
                  />
                </div>
              )}
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label>병렬 결재</Label>
                  <p className="text-sm text-muted-foreground">동일 단계 복수 결재자 허용</p>
                </div>
                <Switch
                  checked={watch('approvalPolicy.parallelApprovalEnabled')}
                  onCheckedChange={(checked) => setValue('approvalPolicy.parallelApprovalEnabled', checked)}
                  disabled={readOnly}
                />
              </div>
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
                '정책 저장'
              )}
            </Button>
          </div>
        )}
      </form>
    </FormProvider>
  );
}
