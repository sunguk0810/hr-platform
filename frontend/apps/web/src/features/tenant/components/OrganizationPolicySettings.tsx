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
import { Loader2, Building2 } from 'lucide-react';
import type { OrganizationPolicy } from '@hr-platform/shared-types';

const createOrganizationPolicySchema = (t: TFunction) =>
  z.object({
    maxDepartmentLevel: z.number().min(1, t('validation.min1level')).max(10, t('validation.max10levels')),
    positionRequired: z.boolean(),
    gradeRequired: z.boolean(),
    allowMultipleDepartments: z.boolean(),
  });

export interface OrganizationPolicySettingsProps {
  initialData?: Partial<OrganizationPolicy>;
  onSubmit?: (data: OrganizationPolicy) => Promise<void>;
  isLoading?: boolean;
  readOnly?: boolean;
}

const defaultOrganizationPolicy: OrganizationPolicy = {
  maxDepartmentLevel: 5,
  positionRequired: true,
  gradeRequired: true,
  allowMultipleDepartments: false,
};

export function OrganizationPolicySettings({
  initialData,
  onSubmit,
  isLoading = false,
  readOnly = false,
}: OrganizationPolicySettingsProps) {
  const { t } = useTranslation('tenant');
  const organizationPolicySchema = React.useMemo(() => createOrganizationPolicySchema(t), [t]);

  const methods = useForm<OrganizationPolicy>({
    resolver: zodResolver(organizationPolicySchema),
    defaultValues: { ...defaultOrganizationPolicy, ...initialData },
  });

  const { register, watch, setValue, handleSubmit } = methods;

  const handleFormSubmit = async (data: OrganizationPolicy) => {
    await onSubmit?.(data);
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
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
                min={1}
                max={10}
                className="w-32"
              />
              <p className="text-xs text-muted-foreground">
                {t('organizationPolicy.maxDepartmentLevelHint')}
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <Label className="text-base">{t('organizationPolicy.requiredFields')}</Label>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label>{t('organizationPolicy.positionRequired')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('organizationPolicy.positionRequiredDescription')}
                  </p>
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
                  <p className="text-sm text-muted-foreground">
                    {t('organizationPolicy.gradeRequiredDescription')}
                  </p>
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
                  <p className="text-sm text-muted-foreground">
                    {t('organizationPolicy.allowMultipleDepartmentsDescription')}
                  </p>
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
