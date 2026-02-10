import { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
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
import { Loader2, FileCheck, Settings, Clock, Users, GitFork } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import type { ApprovalPolicy, ApprovalScope, ApprovalLineBase } from '@hr-platform/shared-types';
import { DEFAULT_APPROVAL_POLICY } from '@hr-platform/shared-types';
import { apiClient } from '@/lib/apiClient';

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
  const { t } = useTranslation('tenant');

  const APPROVAL_LINE_BASE_OPTIONS: { value: ApprovalLineBase; label: string }[] = [
    { value: 'ORGANIZATION', label: t('approvalPolicy.lineBaseOrganization') },
    { value: 'POSITION', label: t('approvalPolicy.lineBasePosition') },
    { value: 'ROLE', label: t('approvalPolicy.lineBaseRole') },
  ];

  const APPROVAL_SCOPE_OPTIONS: { value: ApprovalScope; label: string }[] = [
    { value: 'LEAVE', label: t('approvalPolicy.scopeLeave') },
    { value: 'EXPENSE', label: t('approvalPolicy.scopeExpense') },
    { value: 'DOCUMENT', label: t('approvalPolicy.scopeDocument') },
    { value: 'PURCHASE', label: t('approvalPolicy.scopePurchase') },
    { value: 'GENERAL', label: t('approvalPolicy.scopeGeneral') },
  ];

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
              {t('approvalPolicy.featureTitle')}
            </CardTitle>
            <CardDescription>{t('approvalPolicy.featureDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label>{t('approvalPolicy.parallelApproval')}</Label>
                  <p className="text-sm text-muted-foreground">{t('approvalPolicy.parallelApprovalDescription')}</p>
                </div>
                <Switch
                  checked={watch('features.parallelApproval')}
                  onCheckedChange={(checked) => setValue('features.parallelApproval', checked)}
                  disabled={readOnly}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label>{t('approvalPolicy.consensus')}</Label>
                  <p className="text-sm text-muted-foreground">{t('approvalPolicy.consensusDescription')}</p>
                </div>
                <Switch
                  checked={watch('features.consensus')}
                  onCheckedChange={(checked) => setValue('features.consensus', checked)}
                  disabled={readOnly}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label>{t('approvalPolicy.directApproval')}</Label>
                  <p className="text-sm text-muted-foreground">{t('approvalPolicy.directApprovalDescription')}</p>
                </div>
                <Switch
                  checked={watch('features.directApproval')}
                  onCheckedChange={(checked) => setValue('features.directApproval', checked)}
                  disabled={readOnly}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label>{t('approvalPolicy.proxyApproval')}</Label>
                  <p className="text-sm text-muted-foreground">{t('approvalPolicy.proxyApprovalDescription')}</p>
                </div>
                <Switch
                  checked={watch('features.proxyApproval')}
                  onCheckedChange={(checked) => setValue('features.proxyApproval', checked)}
                  disabled={readOnly}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label>{t('approvalPolicy.autoApprovalLine')}</Label>
                  <p className="text-sm text-muted-foreground">{t('approvalPolicy.autoApprovalLineDescription')}</p>
                </div>
                <Switch
                  checked={watch('features.autoApprovalLine')}
                  onCheckedChange={(checked) => setValue('features.autoApprovalLine', checked)}
                  disabled={readOnly}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label>{t('approvalPolicy.conditionalBranch')}</Label>
                  <p className="text-sm text-muted-foreground">{t('approvalPolicy.conditionalBranchDescription')}</p>
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
              {t('approvalPolicy.autoApprovalLineSettingsTitle')}
            </CardTitle>
            <CardDescription>{t('approvalPolicy.autoApprovalLineSettingsDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label>{t('approvalPolicy.autoApprovalLineEnabled')}</Label>
                <p className="text-sm text-muted-foreground">{t('approvalPolicy.autoApprovalLineEnabledDescription')}</p>
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
                  <Label>{t('approvalPolicy.lineBase')}</Label>
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
                  <Label>{t('approvalPolicy.maxApprovalLevels')}</Label>
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
              {t('approvalPolicy.escalationTitle')}
            </CardTitle>
            <CardDescription>{t('approvalPolicy.escalationDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label>{t('approvalPolicy.escalationEnabled')}</Label>
                <p className="text-sm text-muted-foreground">{t('approvalPolicy.escalationEnabledDescription')}</p>
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
                  <Label>{t('approvalPolicy.reminderTime')}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      {...register('escalation.reminderAfterHours', { valueAsNumber: true })}
                      disabled={readOnly}
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">{t('approvalPolicy.hoursAfter')}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{t('approvalPolicy.reminderHint')}</p>
                </div>
                <div className="space-y-2">
                  <Label>{t('approvalPolicy.escalateTime')}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      {...register('escalation.escalateAfterHours', { valueAsNumber: true })}
                      disabled={readOnly}
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">{t('approvalPolicy.hoursAfter')}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{t('approvalPolicy.escalateHint')}</p>
                </div>
                <div className="space-y-2">
                  <Label>{t('approvalPolicy.autoRejectTime')}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      {...register('escalation.autoRejectAfterHours', { valueAsNumber: true })}
                      disabled={readOnly}
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">{t('approvalPolicy.hoursAfter')}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{t('approvalPolicy.autoRejectHint')}</p>
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
              {t('approvalPolicy.proxyRulesTitle')}
            </CardTitle>
            <CardDescription>{t('approvalPolicy.proxyRulesDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormRow cols={2}>
              <div className="space-y-2">
                <Label>{t('approvalPolicy.maxProxyDuration')}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="1"
                    max="90"
                    {...register('proxyRules.maxDurationDays', { valueAsNumber: true })}
                    disabled={readOnly}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">{t('approvalPolicy.daysUnit')}</span>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label>{t('approvalPolicy.proxyApprovalRequired')}</Label>
                  <p className="text-sm text-muted-foreground">{t('approvalPolicy.proxyApprovalRequiredDescription')}</p>
                </div>
                <Switch
                  checked={watch('proxyRules.requiresApproval')}
                  onCheckedChange={(checked) => setValue('proxyRules.requiresApproval', checked)}
                  disabled={readOnly}
                />
              </div>
            </FormRow>

            <div className="space-y-2">
              <Label>{t('approvalPolicy.proxyScope')}</Label>
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
                  {t('common.saving')}
                </>
              ) : (
                t('common.save')
              )}
            </Button>
          </div>
        )}
      </form>

      {/* 병렬 결재 완료 조건 (별도 저장) */}
      {!readOnly && <ParallelCompletionCard />}
    </FormProvider>
  );
}

function ParallelCompletionCard() {
  const { t } = useTranslation('tenant');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: parallelFeature, isLoading: isLoadingFeature } = useQuery({
    queryKey: ['tenant', 'features', 'PARALLEL_APPROVAL'],
    queryFn: async () => {
      const res = await apiClient.get('/tenants/current/features/PARALLEL_APPROVAL');
      return res.data?.data;
    },
  });

  const [value, setValue] = useState<string>('all');

  useEffect(() => {
    if (parallelFeature?.config?.minApprovers) {
      setValue(parallelFeature.config.minApprovers);
    }
  }, [parallelFeature]);

  const saveMutation = useMutation({
    mutationFn: async (minApprovers: string) => {
      const res = await apiClient.put('/tenants/current/features/PARALLEL_APPROVAL', {
        enabled: true,
        config: { minApprovers, approvalMode: minApprovers === 'one' ? 'or' : 'and' },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant', 'features', 'PARALLEL_APPROVAL'] });
      toast({ title: t('approvalPolicy.saveSuccess'), description: t('approvalPolicy.saveSuccessDescription') });
    },
    onError: () => {
      toast({ title: t('approvalPolicy.saveError'), description: t('approvalPolicy.saveErrorDescription'), variant: 'destructive' });
    },
  });

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitFork className="h-5 w-5 text-blue-600" />
          {t('approvalPolicy.parallelCompletionTitle')}
        </CardTitle>
        <CardDescription>
          {t('approvalPolicy.parallelCompletionDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoadingFeature ? (
          <div className="py-4 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <Select value={value} onValueChange={setValue}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('approvalPolicy.parallelAll')}</SelectItem>
                <SelectItem value="majority">{t('approvalPolicy.parallelMajority')}</SelectItem>
                <SelectItem value="one">{t('approvalPolicy.parallelOne')}</SelectItem>
              </SelectContent>
            </Select>

            <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
              <p className="font-medium mb-1">{t('approvalPolicy.currentSetting')}</p>
              <p>
                {value === 'all' && t('approvalPolicy.parallelAllDescription')}
                {value === 'majority' && t('approvalPolicy.parallelMajorityDescription')}
                {value === 'one' && t('approvalPolicy.parallelOneDescription')}
              </p>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => saveMutation.mutate(value)} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('common.saving')}
                  </>
                ) : (
                  t('approvalPolicy.saveParallelCompletion')
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
