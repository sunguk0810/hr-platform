import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { FormRow } from '@/components/common/Form';
import { Loader2, Shield } from 'lucide-react';
import type { SecurityPolicy } from '@hr-platform/shared-types';

const createSecurityPolicySchema = (t: TFunction) =>
  z.object({
    sessionTimeoutMinutes: z.number().min(5, t('validation.min5minutes')).max(480, t('validation.max8hours')),
    maxLoginAttempts: z.number().min(3, t('validation.min3attempts')).max(10, t('validation.max10attempts')),
    lockoutDurationMinutes: z.number().min(5, t('validation.min5minutes')).max(1440, t('validation.max24hours')),
    mfaEnabled: z.boolean(),
    ipWhitelistEnabled: z.boolean(),
    allowedIps: z.array(z.string()).optional(),
  });

export interface SecurityPolicySettingsProps {
  initialData?: Partial<SecurityPolicy>;
  onSubmit?: (data: SecurityPolicy) => Promise<void>;
  isLoading?: boolean;
  readOnly?: boolean;
}

const defaultSecurityPolicy: SecurityPolicy = {
  sessionTimeoutMinutes: 30,
  maxLoginAttempts: 5,
  lockoutDurationMinutes: 30,
  mfaEnabled: false,
  ipWhitelistEnabled: false,
  allowedIps: [],
};

export function SecurityPolicySettings({
  initialData,
  onSubmit,
  isLoading = false,
  readOnly = false,
}: SecurityPolicySettingsProps) {
  const { t } = useTranslation('tenant');
  const securityPolicySchema = React.useMemo(() => createSecurityPolicySchema(t), [t]);

  const methods = useForm<SecurityPolicy>({
    resolver: zodResolver(securityPolicySchema),
    defaultValues: { ...defaultSecurityPolicy, ...initialData },
  });

  const { register, watch, setValue, handleSubmit } = methods;
  const ipWhitelistEnabled = watch('ipWhitelistEnabled');

  const handleFormSubmit = async (data: SecurityPolicy) => {
    await onSubmit?.(data);
  };

  const handleIpChange = (value: string) => {
    const ips = value.split('\n').map(ip => ip.trim()).filter(Boolean);
    setValue('allowedIps', ips);
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
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
                  min={5}
                  max={480}
                />
                <p className="text-xs text-muted-foreground">{t('securityPolicy.sessionTimeoutHint')}</p>
              </div>
              <div className="space-y-2">
                <Label>{t('securityPolicy.maxLoginAttempts')}</Label>
                <Input
                  type="number"
                  {...register('maxLoginAttempts', { valueAsNumber: true })}
                  disabled={readOnly}
                  min={3}
                  max={10}
                />
                <p className="text-xs text-muted-foreground">{t('securityPolicy.maxLoginAttemptsHint')}</p>
              </div>
              <div className="space-y-2">
                <Label>{t('securityPolicy.lockoutDuration')}</Label>
                <Input
                  type="number"
                  {...register('lockoutDurationMinutes', { valueAsNumber: true })}
                  disabled={readOnly}
                  min={5}
                  max={1440}
                />
                <p className="text-xs text-muted-foreground">{t('securityPolicy.lockoutDurationHint')}</p>
              </div>
            </FormRow>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label>{t('securityPolicy.mfa')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('securityPolicy.mfaDescription')}
                  </p>
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
                  <p className="text-sm text-muted-foreground">
                    {t('securityPolicy.ipWhitelistDescription')}
                  </p>
                </div>
                <Switch
                  checked={ipWhitelistEnabled}
                  onCheckedChange={(checked) => setValue('ipWhitelistEnabled', checked)}
                  disabled={readOnly}
                />
              </div>

              {ipWhitelistEnabled && (
                <div className="space-y-2 pl-4">
                  <Label>{t('securityPolicy.allowedIps')}</Label>
                  <Textarea
                    placeholder={t('securityPolicy.allowedIpsPlaceholder')}
                    value={watch('allowedIps')?.join('\n') || ''}
                    onChange={(e) => handleIpChange(e.target.value)}
                    disabled={readOnly}
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('securityPolicy.allowedIpsHint')}
                  </p>
                </div>
              )}
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
    </FormProvider>
  );
}
