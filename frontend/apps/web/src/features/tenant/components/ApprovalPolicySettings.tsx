import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormRow } from '@/components/common/Form';
import { Loader2, FileCheck, Settings, Clock, Users } from 'lucide-react';
import type { ApprovalPolicy, ApprovalScope, ApprovalLineBase } from '@hr-platform/shared-types';
import { DEFAULT_APPROVAL_POLICY } from '@hr-platform/shared-types';

const approvalPolicySchema = z.object({
  features: z.object({
    parallelApproval: z.boolean(),
    consensus: z.boolean(),
    directApproval: z.boolean(),
    proxyApproval: z.boolean(),
    autoApprovalLine: z.boolean(),
    conditionalBranch: z.boolean(),
  }),
  autoApprovalLine: z.object({
    enabled: z.boolean(),
    baseOn: z.enum(['ORGANIZATION', 'POSITION', 'ROLE']),
    maxLevels: z.number().min(1).max(10),
  }),
  escalation: z.object({
    enabled: z.boolean(),
    reminderAfterHours: z.number().min(1).max(168),
    escalateAfterHours: z.number().min(1).max(336),
    autoRejectAfterHours: z.number().min(1).max(720),
  }),
  proxyRules: z.object({
    maxDurationDays: z.number().min(1).max(90),
    requiresApproval: z.boolean(),
    allowedScope: z.array(z.enum(['LEAVE', 'EXPENSE', 'DOCUMENT', 'PURCHASE', 'GENERAL'])),
  }),
});

const APPROVAL_LINE_BASE_OPTIONS: { value: ApprovalLineBase; label: string }[] = [
  { value: 'ORGANIZATION', label: '조직 기반' },
  { value: 'POSITION', label: '직책 기반' },
  { value: 'ROLE', label: '역할 기반' },
];

const APPROVAL_SCOPE_OPTIONS: { value: ApprovalScope; label: string }[] = [
  { value: 'LEAVE', label: '휴가' },
  { value: 'EXPENSE', label: '지출' },
  { value: 'DOCUMENT', label: '문서' },
  { value: 'PURCHASE', label: '구매' },
  { value: 'GENERAL', label: '일반' },
];

export interface ApprovalPolicySettingsProps {
  initialData?: ApprovalPolicy;
  onSubmit: (data: ApprovalPolicy) => Promise<void>;
  isLoading?: boolean;
  readOnly?: boolean;
}

export function ApprovalPolicySettings({
  initialData,
  onSubmit,
  isLoading = false,
  readOnly = false,
}: ApprovalPolicySettingsProps) {
  const methods = useForm<ApprovalPolicy>({
    resolver: zodResolver(approvalPolicySchema),
    defaultValues: initialData ?? DEFAULT_APPROVAL_POLICY,
  });

  const { register, watch, setValue, handleSubmit, formState: { errors } } = methods;

  const handleScopeChange = (scope: ApprovalScope, checked: boolean) => {
    const currentScope = watch('proxyRules.allowedScope');
    if (checked) {
      setValue('proxyRules.allowedScope', [...currentScope, scope]);
    } else {
      setValue(
        'proxyRules.allowedScope',
        currentScope.filter((s) => s !== scope)
      );
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* 결재 기능 활성화 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              결재 기능 설정
            </CardTitle>
            <CardDescription>사용할 결재 기능을 선택합니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label>병렬 결재</Label>
                  <p className="text-sm text-muted-foreground">동일 단계 복수 결재자</p>
                </div>
                <Switch
                  checked={watch('features.parallelApproval')}
                  onCheckedChange={(checked) => setValue('features.parallelApproval', checked)}
                  disabled={readOnly}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label>합의</Label>
                  <p className="text-sm text-muted-foreground">결재 라인에 합의자 추가</p>
                </div>
                <Switch
                  checked={watch('features.consensus')}
                  onCheckedChange={(checked) => setValue('features.consensus', checked)}
                  disabled={readOnly}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label>전결</Label>
                  <p className="text-sm text-muted-foreground">결재 라인 단축 처리</p>
                </div>
                <Switch
                  checked={watch('features.directApproval')}
                  onCheckedChange={(checked) => setValue('features.directApproval', checked)}
                  disabled={readOnly}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label>대결</Label>
                  <p className="text-sm text-muted-foreground">부재 시 대리 결재</p>
                </div>
                <Switch
                  checked={watch('features.proxyApproval')}
                  onCheckedChange={(checked) => setValue('features.proxyApproval', checked)}
                  disabled={readOnly}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label>자동 결재선</Label>
                  <p className="text-sm text-muted-foreground">문서별 자동 결재선 생성</p>
                </div>
                <Switch
                  checked={watch('features.autoApprovalLine')}
                  onCheckedChange={(checked) => setValue('features.autoApprovalLine', checked)}
                  disabled={readOnly}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label>조건 분기</Label>
                  <p className="text-sm text-muted-foreground">조건에 따른 결재선 분기</p>
                </div>
                <Switch
                  checked={watch('features.conditionalBranch')}
                  onCheckedChange={(checked) => setValue('features.conditionalBranch', checked)}
                  disabled={readOnly}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 자동 결재선 설정 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              자동 결재선 설정
            </CardTitle>
            <CardDescription>결재선 자동 생성 규칙 설정</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label>자동 결재선 활성화</Label>
                <p className="text-sm text-muted-foreground">문서 생성 시 결재선 자동 지정</p>
              </div>
              <Switch
                checked={watch('autoApprovalLine.enabled')}
                onCheckedChange={(checked) => setValue('autoApprovalLine.enabled', checked)}
                disabled={readOnly}
              />
            </div>

            {watch('autoApprovalLine.enabled') && (
              <FormRow cols={2}>
                <div className="space-y-2">
                  <Label>결재선 기준</Label>
                  <Select
                    value={watch('autoApprovalLine.baseOn')}
                    onValueChange={(value: ApprovalLineBase) =>
                      setValue('autoApprovalLine.baseOn', value)
                    }
                    disabled={readOnly}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {APPROVAL_LINE_BASE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>최대 결재 단계</Label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    {...register('autoApprovalLine.maxLevels', { valueAsNumber: true })}
                    disabled={readOnly}
                    className="w-24"
                  />
                  {errors.autoApprovalLine?.maxLevels && (
                    <p className="text-sm text-destructive">
                      {errors.autoApprovalLine.maxLevels.message}
                    </p>
                  )}
                </div>
              </FormRow>
            )}
          </CardContent>
        </Card>

        {/* 에스컬레이션 설정 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              에스컬레이션 설정
            </CardTitle>
            <CardDescription>결재 지연 시 알림 및 자동 처리 설정</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label>에스컬레이션 활성화</Label>
                <p className="text-sm text-muted-foreground">결재 지연 시 자동 알림 및 상신</p>
              </div>
              <Switch
                checked={watch('escalation.enabled')}
                onCheckedChange={(checked) => setValue('escalation.enabled', checked)}
                disabled={readOnly}
              />
            </div>

            {watch('escalation.enabled') && (
              <FormRow cols={3}>
                <div className="space-y-2">
                  <Label>알림 시간</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      {...register('escalation.reminderAfterHours', { valueAsNumber: true })}
                      disabled={readOnly}
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">시간 후</span>
                  </div>
                  <p className="text-xs text-muted-foreground">결재자에게 알림 발송</p>
                </div>
                <div className="space-y-2">
                  <Label>상신 시간</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      {...register('escalation.escalateAfterHours', { valueAsNumber: true })}
                      disabled={readOnly}
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">시간 후</span>
                  </div>
                  <p className="text-xs text-muted-foreground">상위 결재자에게 상신</p>
                </div>
                <div className="space-y-2">
                  <Label>자동 반려 시간</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      {...register('escalation.autoRejectAfterHours', { valueAsNumber: true })}
                      disabled={readOnly}
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">시간 후</span>
                  </div>
                  <p className="text-xs text-muted-foreground">자동 반려 처리</p>
                </div>
              </FormRow>
            )}
          </CardContent>
        </Card>

        {/* 대결 규칙 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              대결 규칙
            </CardTitle>
            <CardDescription>부재 시 대리 결재 관련 설정</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormRow cols={2}>
              <div className="space-y-2">
                <Label>최대 대결 기간</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="1"
                    max="90"
                    {...register('proxyRules.maxDurationDays', { valueAsNumber: true })}
                    disabled={readOnly}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">일</span>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label>대결 지정 승인 필요</Label>
                  <p className="text-sm text-muted-foreground">대결자 지정 시 승인 필요</p>
                </div>
                <Switch
                  checked={watch('proxyRules.requiresApproval')}
                  onCheckedChange={(checked) => setValue('proxyRules.requiresApproval', checked)}
                  disabled={readOnly}
                />
              </div>
            </FormRow>

            <div className="space-y-2">
              <Label>대결 허용 범위</Label>
              <div className="flex flex-wrap gap-4 pt-2">
                {APPROVAL_SCOPE_OPTIONS.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`scope-${option.value}`}
                      checked={watch('proxyRules.allowedScope').includes(option.value)}
                      onCheckedChange={(checked) =>
                        handleScopeChange(option.value, checked as boolean)
                      }
                      disabled={readOnly}
                    />
                    <Label htmlFor={`scope-${option.value}`} className="text-sm font-normal">
                      {option.label}
                    </Label>
                  </div>
                ))}
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
                '저장'
              )}
            </Button>
          </div>
        )}
      </form>
    </FormProvider>
  );
}
