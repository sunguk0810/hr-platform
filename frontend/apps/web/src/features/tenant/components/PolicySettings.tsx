import * as React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('tenant');
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
              {t('passwordPolicy.title')}
            </CardTitle>
            <CardDescription>{t('passwordPolicy.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormRow cols={3}>
              <div className="space-y-2">
                <Label>{t('passwordPolicy.minLength')}</Label>
                <Input
                  type="number"
                  {...register('minLength', { valueAsNumber: true })}
                  disabled={readOnly}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('passwordPolicy.expiryDays')}</Label>
                <Input
                  type="number"
                  {...register('expiryDays', { valueAsNumber: true })}
                  disabled={readOnly}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('passwordPolicy.historyCount')}</Label>
                <Input
                  type="number"
                  {...register('historyCount', { valueAsNumber: true })}
                  disabled={readOnly}
                />
              </div>
            </FormRow>
            <div className="space-y-3 pt-2">
              <Label className="text-base">{t('passwordPolicy.complexityShort')}</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <Label>{t('passwordPolicy.requireUppercase')}</Label>
                  <Switch
                    checked={watch('requireUppercase')}
                    onCheckedChange={(checked) => setValue('requireUppercase', checked)}
                    disabled={readOnly}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <Label>{t('passwordPolicy.requireLowercase')}</Label>
                  <Switch
                    checked={watch('requireLowercase')}
                    onCheckedChange={(checked) => setValue('requireLowercase', checked)}
                    disabled={readOnly}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <Label>{t('passwordPolicy.requireNumber')}</Label>
                  <Switch
                    checked={watch('requireNumber')}
                    onCheckedChange={(checked) => setValue('requireNumber', checked)}
                    disabled={readOnly}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <Label>{t('passwordPolicy.requireSpecialChar')}</Label>
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
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('common.saving')}</> : t('common.save')}
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
  const { t } = useTranslation('tenant');
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
              {t('securityPolicy.title')}
            </CardTitle>
            <CardDescription>{t('securityPolicy.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormRow cols={3}>
              <div className="space-y-2">
                <Label>{t('securityPolicy.sessionTimeout')}</Label>
                <Input
                  type="number"
                  {...register('sessionTimeoutMinutes', { valueAsNumber: true })}
                  disabled={readOnly}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('securityPolicy.maxLoginAttempts')}</Label>
                <Input
                  type="number"
                  {...register('maxLoginAttempts', { valueAsNumber: true })}
                  disabled={readOnly}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('securityPolicy.lockoutDuration')}</Label>
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
                  <Label>{t('securityPolicy.mfa')}</Label>
                  <p className="text-sm text-muted-foreground">{t('securityPolicy.mfaDescription')}</p>
                </div>
                <Switch
                  checked={watch('mfaEnabled')}
                  onCheckedChange={(checked) => setValue('mfaEnabled', checked)}
                  disabled={readOnly}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label>{t('securityPolicy.ipWhitelist')}</Label>
                  <p className="text-sm text-muted-foreground">{t('securityPolicy.ipWhitelistDescription')}</p>
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
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('common.saving')}</> : t('common.save')}
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
  const { t } = useTranslation('tenant');
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
              {t('notificationPolicy.title')}
            </CardTitle>
            <CardDescription>{t('notificationPolicy.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label className="text-base">{t('notificationPolicy.channels')}</Label>
              <div className="grid grid-cols-3 gap-3">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <Label>{t('notificationPolicy.emailLabel')}</Label>
                  <Switch
                    checked={watch('emailEnabled')}
                    onCheckedChange={(checked) => setValue('emailEnabled', checked)}
                    disabled={readOnly}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <Label>{t('notificationPolicy.pushLabel')}</Label>
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
                <Label>{t('notificationPolicy.doNotDisturbMode')}</Label>
                <p className="text-sm text-muted-foreground">{t('notificationPolicy.doNotDisturbDescription')}</p>
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
                  <Label>{t('notificationPolicy.startTime')}</Label>
                  <Input type="time" {...register('quietHoursStart')} disabled={readOnly} />
                </div>
                <div className="space-y-2">
                  <Label>{t('notificationPolicy.endTime')}</Label>
                  <Input type="time" {...register('quietHoursEnd')} disabled={readOnly} />
                </div>
              </FormRow>
            )}
          </CardContent>
        </Card>
        {!readOnly && (
          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('common.saving')}</> : t('common.save')}
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
  const { t } = useTranslation('tenant');
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
              {t('organizationPolicy.title')}
            </CardTitle>
            <CardDescription>{t('organizationPolicy.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t('organizationPolicy.maxDepartmentLevel')}</Label>
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
                  <Label>{t('organizationPolicy.positionRequired')}</Label>
                  <p className="text-sm text-muted-foreground">{t('organizationPolicy.positionRequiredDescription')}</p>
                </div>
                <Switch
                  checked={watch('positionRequired')}
                  onCheckedChange={(checked) => setValue('positionRequired', checked)}
                  disabled={readOnly}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label>{t('organizationPolicy.gradeRequired')}</Label>
                  <p className="text-sm text-muted-foreground">{t('organizationPolicy.gradeRequiredDescription')}</p>
                </div>
                <Switch
                  checked={watch('gradeRequired')}
                  onCheckedChange={(checked) => setValue('gradeRequired', checked)}
                  disabled={readOnly}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label>{t('organizationPolicy.allowMultipleDepartments')}</Label>
                  <p className="text-sm text-muted-foreground">{t('organizationPolicy.allowMultipleDepartmentsDescription')}</p>
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
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('common.saving')}</> : t('common.save')}
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
  const { t } = useTranslation('tenant');
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
        <TabsTrigger value="password">{t('policyTabs.password')}</TabsTrigger>
        <TabsTrigger value="security">{t('policyTabs.security')}</TabsTrigger>
        <TabsTrigger value="notification">{t('policyTabs.notification')}</TabsTrigger>
        <TabsTrigger value="organization">{t('policyTabs.organization')}</TabsTrigger>
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
