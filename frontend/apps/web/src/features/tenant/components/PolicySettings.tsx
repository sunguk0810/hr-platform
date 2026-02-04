import * as React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { FormRow } from '@/components/common/Form';
import { Loader2, KeyRound, Shield, Bell, Building2 } from 'lucide-react';
import type {
  TenantPolicies,
  PasswordPolicy,
  SecurityPolicy,
  NotificationPolicy,
  OrganizationPolicy,
  PolicyType,
} from '@hr-platform/shared-types';

// Schema definitions for maintained policies
const passwordPolicySchema = z.object({
  minLength: z.number().min(6).max(32),
  requireUppercase: z.boolean(),
  requireLowercase: z.boolean(),
  requireNumber: z.boolean(),
  requireSpecialChar: z.boolean(),
  expiryDays: z.number().min(0).max(365),
  historyCount: z.number().min(0).max(24),
});

const securityPolicySchema = z.object({
  sessionTimeoutMinutes: z.number().min(5).max(480),
  maxLoginAttempts: z.number().min(3).max(10),
  lockoutDurationMinutes: z.number().min(5).max(1440),
  mfaEnabled: z.boolean(),
  ipWhitelistEnabled: z.boolean(),
  allowedIps: z.array(z.string()).optional(),
});

const notificationPolicySchema = z.object({
  emailEnabled: z.boolean(),
  pushEnabled: z.boolean(),
  smsEnabled: z.boolean(),
  quietHoursEnabled: z.boolean(),
  quietHoursStart: z.string(),
  quietHoursEnd: z.string(),
});

const organizationPolicySchema = z.object({
  maxDepartmentLevel: z.number().min(1).max(10),
  positionRequired: z.boolean(),
  gradeRequired: z.boolean(),
  allowMultipleDepartments: z.boolean(),
});

export interface PolicySettingsProps {
  initialData?: Partial<TenantPolicies>;
  onSubmit?: (policyType: PolicyType, data: unknown) => Promise<void>;
  isLoading?: boolean;
  readOnly?: boolean;
}

// Default values
const defaultPasswordPolicy: PasswordPolicy = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: false,
  expiryDays: 90,
  historyCount: 3,
};

const defaultSecurityPolicy: SecurityPolicy = {
  sessionTimeoutMinutes: 30,
  maxLoginAttempts: 5,
  lockoutDurationMinutes: 30,
  mfaEnabled: false,
  ipWhitelistEnabled: false,
  allowedIps: [],
};

const defaultNotificationPolicy: NotificationPolicy = {
  emailEnabled: true,
  pushEnabled: true,
  smsEnabled: false,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
};

const defaultOrganizationPolicy: OrganizationPolicy = {
  maxDepartmentLevel: 5,
  positionRequired: true,
  gradeRequired: true,
  allowMultipleDepartments: false,
};

function PasswordPolicyForm({
  initialData,
  onSubmit,
  isLoading,
  readOnly,
}: {
  initialData: PasswordPolicy;
  onSubmit: (data: PasswordPolicy) => void;
  isLoading: boolean;
  readOnly: boolean;
}) {
  const methods = useForm<PasswordPolicy>({
    resolver: zodResolver(passwordPolicySchema),
    defaultValues: initialData,
  });

  const { register, watch, setValue, handleSubmit } = methods;

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              비밀번호 정책
            </CardTitle>
            <CardDescription>비밀번호 복잡도 및 만료 설정</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormRow cols={3}>
              <div className="space-y-2">
                <Label>최소 길이</Label>
                <Input
                  type="number"
                  {...register('minLength', { valueAsNumber: true })}
                  disabled={readOnly}
                />
              </div>
              <div className="space-y-2">
                <Label>비밀번호 만료 (일)</Label>
                <Input
                  type="number"
                  {...register('expiryDays', { valueAsNumber: true })}
                  disabled={readOnly}
                />
              </div>
              <div className="space-y-2">
                <Label>재사용 금지 개수</Label>
                <Input
                  type="number"
                  {...register('historyCount', { valueAsNumber: true })}
                  disabled={readOnly}
                />
              </div>
            </FormRow>
            <div className="space-y-3 pt-2">
              <Label className="text-base">비밀번호 복잡도</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <Label>대문자 포함</Label>
                  <Switch
                    checked={watch('requireUppercase')}
                    onCheckedChange={(checked) => setValue('requireUppercase', checked)}
                    disabled={readOnly}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <Label>소문자 포함</Label>
                  <Switch
                    checked={watch('requireLowercase')}
                    onCheckedChange={(checked) => setValue('requireLowercase', checked)}
                    disabled={readOnly}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <Label>숫자 포함</Label>
                  <Switch
                    checked={watch('requireNumber')}
                    onCheckedChange={(checked) => setValue('requireNumber', checked)}
                    disabled={readOnly}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <Label>특수문자 포함</Label>
                  <Switch
                    checked={watch('requireSpecialChar')}
                    onCheckedChange={(checked) => setValue('requireSpecialChar', checked)}
                    disabled={readOnly}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        {!readOnly && (
          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />저장 중...</> : '저장'}
            </Button>
          </div>
        )}
      </form>
    </FormProvider>
  );
}

function SecurityPolicyForm({
  initialData,
  onSubmit,
  isLoading,
  readOnly,
}: {
  initialData: SecurityPolicy;
  onSubmit: (data: SecurityPolicy) => void;
  isLoading: boolean;
  readOnly: boolean;
}) {
  const methods = useForm<SecurityPolicy>({
    resolver: zodResolver(securityPolicySchema),
    defaultValues: initialData,
  });

  const { register, watch, setValue, handleSubmit } = methods;

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              보안 정책
            </CardTitle>
            <CardDescription>세션 및 로그인 보안 설정</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormRow cols={3}>
              <div className="space-y-2">
                <Label>세션 타임아웃 (분)</Label>
                <Input
                  type="number"
                  {...register('sessionTimeoutMinutes', { valueAsNumber: true })}
                  disabled={readOnly}
                />
              </div>
              <div className="space-y-2">
                <Label>최대 로그인 시도</Label>
                <Input
                  type="number"
                  {...register('maxLoginAttempts', { valueAsNumber: true })}
                  disabled={readOnly}
                />
              </div>
              <div className="space-y-2">
                <Label>계정 잠금 시간 (분)</Label>
                <Input
                  type="number"
                  {...register('lockoutDurationMinutes', { valueAsNumber: true })}
                  disabled={readOnly}
                />
              </div>
            </FormRow>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label>2단계 인증 (MFA)</Label>
                  <p className="text-sm text-muted-foreground">OTP 또는 인증 앱을 통한 2단계 인증 필수</p>
                </div>
                <Switch
                  checked={watch('mfaEnabled')}
                  onCheckedChange={(checked) => setValue('mfaEnabled', checked)}
                  disabled={readOnly}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label>IP 화이트리스트</Label>
                  <p className="text-sm text-muted-foreground">허용된 IP 주소에서만 접속 가능</p>
                </div>
                <Switch
                  checked={watch('ipWhitelistEnabled')}
                  onCheckedChange={(checked) => setValue('ipWhitelistEnabled', checked)}
                  disabled={readOnly}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        {!readOnly && (
          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />저장 중...</> : '저장'}
            </Button>
          </div>
        )}
      </form>
    </FormProvider>
  );
}

function NotificationPolicyForm({
  initialData,
  onSubmit,
  isLoading,
  readOnly,
}: {
  initialData: NotificationPolicy;
  onSubmit: (data: NotificationPolicy) => void;
  isLoading: boolean;
  readOnly: boolean;
}) {
  const methods = useForm<NotificationPolicy>({
    resolver: zodResolver(notificationPolicySchema),
    defaultValues: initialData,
  });

  const { register, watch, setValue, handleSubmit } = methods;

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              알림 정책
            </CardTitle>
            <CardDescription>알림 채널 및 방해 금지 설정</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label className="text-base">알림 채널</Label>
              <div className="grid grid-cols-3 gap-3">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <Label>이메일</Label>
                  <Switch
                    checked={watch('emailEnabled')}
                    onCheckedChange={(checked) => setValue('emailEnabled', checked)}
                    disabled={readOnly}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <Label>푸시</Label>
                  <Switch
                    checked={watch('pushEnabled')}
                    onCheckedChange={(checked) => setValue('pushEnabled', checked)}
                    disabled={readOnly}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <Label>SMS</Label>
                  <Switch
                    checked={watch('smsEnabled')}
                    onCheckedChange={(checked) => setValue('smsEnabled', checked)}
                    disabled={readOnly}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label>방해 금지 모드</Label>
                <p className="text-sm text-muted-foreground">지정된 시간에 알림 발송 차단</p>
              </div>
              <Switch
                checked={watch('quietHoursEnabled')}
                onCheckedChange={(checked) => setValue('quietHoursEnabled', checked)}
                disabled={readOnly}
              />
            </div>
            {watch('quietHoursEnabled') && (
              <FormRow cols={2}>
                <div className="space-y-2">
                  <Label>시작 시간</Label>
                  <Input type="time" {...register('quietHoursStart')} disabled={readOnly} />
                </div>
                <div className="space-y-2">
                  <Label>종료 시간</Label>
                  <Input type="time" {...register('quietHoursEnd')} disabled={readOnly} />
                </div>
              </FormRow>
            )}
          </CardContent>
        </Card>
        {!readOnly && (
          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />저장 중...</> : '저장'}
            </Button>
          </div>
        )}
      </form>
    </FormProvider>
  );
}

function OrganizationPolicyForm({
  initialData,
  onSubmit,
  isLoading,
  readOnly,
}: {
  initialData: OrganizationPolicy;
  onSubmit: (data: OrganizationPolicy) => void;
  isLoading: boolean;
  readOnly: boolean;
}) {
  const methods = useForm<OrganizationPolicy>({
    resolver: zodResolver(organizationPolicySchema),
    defaultValues: initialData,
  });

  const { register, watch, setValue, handleSubmit } = methods;

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              조직 정책
            </CardTitle>
            <CardDescription>조직 구조 및 인사 정보 설정</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>최대 부서 단계</Label>
              <Input
                type="number"
                {...register('maxDepartmentLevel', { valueAsNumber: true })}
                disabled={readOnly}
                className="w-32"
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label>직책 필수</Label>
                  <p className="text-sm text-muted-foreground">직원 등록 시 직책 입력 필수</p>
                </div>
                <Switch
                  checked={watch('positionRequired')}
                  onCheckedChange={(checked) => setValue('positionRequired', checked)}
                  disabled={readOnly}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label>직급 필수</Label>
                  <p className="text-sm text-muted-foreground">직원 등록 시 직급 입력 필수</p>
                </div>
                <Switch
                  checked={watch('gradeRequired')}
                  onCheckedChange={(checked) => setValue('gradeRequired', checked)}
                  disabled={readOnly}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label>복수 부서 소속 허용</Label>
                  <p className="text-sm text-muted-foreground">한 직원이 여러 부서에 소속될 수 있음</p>
                </div>
                <Switch
                  checked={watch('allowMultipleDepartments')}
                  onCheckedChange={(checked) => setValue('allowMultipleDepartments', checked)}
                  disabled={readOnly}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        {!readOnly && (
          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />저장 중...</> : '저장'}
            </Button>
          </div>
        )}
      </form>
    </FormProvider>
  );
}

// Main component with tabs (only for password, security, notification, organization policies)
export function PolicySettings({
  initialData,
  onSubmit,
  isLoading = false,
  readOnly = false,
}: PolicySettingsProps) {
  const [savingPolicy, setSavingPolicy] = React.useState<PolicyType | null>(null);

  const handleSubmit = async (policyType: PolicyType, data: unknown) => {
    setSavingPolicy(policyType);
    try {
      await onSubmit?.(policyType, data);
    } finally {
      setSavingPolicy(null);
    }
  };

  return (
    <Tabs defaultValue="password" className="space-y-4">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="password">비밀번호</TabsTrigger>
        <TabsTrigger value="security">보안</TabsTrigger>
        <TabsTrigger value="notification">알림</TabsTrigger>
        <TabsTrigger value="organization">조직</TabsTrigger>
      </TabsList>

      <TabsContent value="password">
        <PasswordPolicyForm
          initialData={{ ...defaultPasswordPolicy, ...initialData?.passwordPolicy }}
          onSubmit={(data) => handleSubmit('PASSWORD', data)}
          isLoading={isLoading || savingPolicy === 'PASSWORD'}
          readOnly={readOnly}
        />
      </TabsContent>

      <TabsContent value="security">
        <SecurityPolicyForm
          initialData={{ ...defaultSecurityPolicy, ...initialData?.securityPolicy }}
          onSubmit={(data) => handleSubmit('SECURITY', data)}
          isLoading={isLoading || savingPolicy === 'SECURITY'}
          readOnly={readOnly}
        />
      </TabsContent>

      <TabsContent value="notification">
        <NotificationPolicyForm
          initialData={{ ...defaultNotificationPolicy, ...initialData?.notificationPolicy }}
          onSubmit={(data) => handleSubmit('NOTIFICATION', data)}
          isLoading={isLoading || savingPolicy === 'NOTIFICATION'}
          readOnly={readOnly}
        />
      </TabsContent>

      <TabsContent value="organization">
        <OrganizationPolicyForm
          initialData={{ ...defaultOrganizationPolicy, ...initialData?.organizationPolicy }}
          onSubmit={(data) => handleSubmit('ORGANIZATION', data)}
          isLoading={isLoading || savingPolicy === 'ORGANIZATION'}
          readOnly={readOnly}
        />
      </TabsContent>
    </Tabs>
  );
}
