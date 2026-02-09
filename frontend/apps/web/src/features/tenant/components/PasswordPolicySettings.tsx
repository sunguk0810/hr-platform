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
import { FormRow } from '@/components/common/Form';
import { Loader2, KeyRound } from 'lucide-react';
import type { PasswordPolicy } from '@hr-platform/shared-types';

const createPasswordPolicySchema = (t: TFunction) =>
  z.object({
    minLength: z.number().min(6, t('validation.minLength6')).max(32, t('validation.maxLength32')),
    requireUppercase: z.boolean(),
    requireLowercase: z.boolean(),
    requireNumber: z.boolean(),
    requireSpecialChar: z.boolean(),
    expiryDays: z.number().min(0, t('validation.min0')).max(365, t('validation.max365days')),
    historyCount: z.number().min(0, t('validation.min0')).max(24, t('validation.max24')),
  });

export interface PasswordPolicySettingsProps {
  initialData?: Partial<PasswordPolicy>;
  onSubmit?: (data: PasswordPolicy) => Promise<void>;
  isLoading?: boolean;
  readOnly?: boolean;
}

const defaultPasswordPolicy: PasswordPolicy = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: false,
  expiryDays: 90,
  historyCount: 3,
};

export function PasswordPolicySettings({
  initialData,
  onSubmit,
  isLoading = false,
  readOnly = false,
}: PasswordPolicySettingsProps) {
  const { t } = useTranslation('tenant');
  const passwordPolicySchema = React.useMemo(() => createPasswordPolicySchema(t), [t]);

  const methods = useForm<PasswordPolicy>({
    resolver: zodResolver(passwordPolicySchema),
    defaultValues: { ...defaultPasswordPolicy, ...initialData },
  });

  const { register, watch, setValue, handleSubmit } = methods;

  const handleFormSubmit = async (data: PasswordPolicy) => {
    await onSubmit?.(data);
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              {t('passwordPolicy.title')}
            </CardTitle>
            <CardDescription>{t('passwordPolicy.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormRow cols={2}>
              <div className="space-y-2">
                <Label>{t('passwordPolicy.minLength')}</Label>
                <Input
                  type="number"
                  {...register('minLength', { valueAsNumber: true })}
                  disabled={readOnly}
                  min={6}
                  max={32}
                />
                <p className="text-xs text-muted-foreground">{t('passwordPolicy.minLengthHint')}</p>
              </div>
              <div className="space-y-2">
                <Label>{t('passwordPolicy.expiryDays')}</Label>
                <Input
                  type="number"
                  {...register('expiryDays', { valueAsNumber: true })}
                  disabled={readOnly}
                  min={0}
                  max={365}
                />
                <p className="text-xs text-muted-foreground">{t('passwordPolicy.expiryDaysHint')}</p>
              </div>
            </FormRow>

            <div className="space-y-2">
              <Label>{t('passwordPolicy.historyCount')}</Label>
              <Input
                type="number"
                {...register('historyCount', { valueAsNumber: true })}
                disabled={readOnly}
                min={0}
                max={24}
                className="w-32"
              />
              <p className="text-xs text-muted-foreground">
                {t('passwordPolicy.historyCountHint')}
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <Label className="text-base">{t('passwordPolicy.complexity')}</Label>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label>{t('passwordPolicy.requireUppercase')}</Label>
                  <p className="text-sm text-muted-foreground">{t('passwordPolicy.requireUppercaseHint')}</p>
                </div>
                <Switch
                  checked={watch('requireUppercase')}
                  onCheckedChange={(checked) => setValue('requireUppercase', checked)}
                  disabled={readOnly}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label>{t('passwordPolicy.requireLowercase')}</Label>
                  <p className="text-sm text-muted-foreground">{t('passwordPolicy.requireLowercaseHint')}</p>
                </div>
                <Switch
                  checked={watch('requireLowercase')}
                  onCheckedChange={(checked) => setValue('requireLowercase', checked)}
                  disabled={readOnly}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label>{t('passwordPolicy.requireNumber')}</Label>
                  <p className="text-sm text-muted-foreground">{t('passwordPolicy.requireNumberHint')}</p>
                </div>
                <Switch
                  checked={watch('requireNumber')}
                  onCheckedChange={(checked) => setValue('requireNumber', checked)}
                  disabled={readOnly}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label>{t('passwordPolicy.requireSpecialChar')}</Label>
                  <p className="text-sm text-muted-foreground">{t('passwordPolicy.requireSpecialCharHint')}</p>
                </div>
                <Switch
                  checked={watch('requireSpecialChar')}
                  onCheckedChange={(checked) => setValue('requireSpecialChar', checked)}
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
