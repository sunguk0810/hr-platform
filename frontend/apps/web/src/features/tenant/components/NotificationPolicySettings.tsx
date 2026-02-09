import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { FormRow } from '@/components/common/Form';
import { Loader2, Bell } from 'lucide-react';
import type { NotificationPolicy } from '@hr-platform/shared-types';

const notificationPolicySchema = z.object({
  emailEnabled: z.boolean(),
  pushEnabled: z.boolean(),
  smsEnabled: z.boolean(),
  quietHoursEnabled: z.boolean(),
  quietHoursStart: z.string(),
  quietHoursEnd: z.string(),
});

export interface NotificationPolicySettingsProps {
  initialData?: Partial<NotificationPolicy>;
  onSubmit?: (data: NotificationPolicy) => Promise<void>;
  isLoading?: boolean;
  readOnly?: boolean;
}

const defaultNotificationPolicy: NotificationPolicy = {
  emailEnabled: true,
  pushEnabled: true,
  smsEnabled: false,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
};

export function NotificationPolicySettings({
  initialData,
  onSubmit,
  isLoading = false,
  readOnly = false,
}: NotificationPolicySettingsProps) {
  const { t } = useTranslation('tenant');

  const methods = useForm<NotificationPolicy>({
    resolver: zodResolver(notificationPolicySchema),
    defaultValues: { ...defaultNotificationPolicy, ...initialData },
  });

  const { register, watch, setValue, handleSubmit } = methods;
  const quietHoursEnabled = watch('quietHoursEnabled');

  const handleFormSubmit = async (data: NotificationPolicy) => {
    await onSubmit?.(data);
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
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

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label>{t('notificationPolicy.emailNotification')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('notificationPolicy.emailNotificationDescription')}
                  </p>
                </div>
                <Switch
                  checked={watch('emailEnabled')}
                  onCheckedChange={(checked) => setValue('emailEnabled', checked)}
                  disabled={readOnly}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label>{t('notificationPolicy.pushNotification')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('notificationPolicy.pushNotificationDescription')}
                  </p>
                </div>
                <Switch
                  checked={watch('pushEnabled')}
                  onCheckedChange={(checked) => setValue('pushEnabled', checked)}
                  disabled={readOnly}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label>{t('notificationPolicy.smsNotification')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('notificationPolicy.smsNotificationDescription')}
                  </p>
                </div>
                <Switch
                  checked={watch('smsEnabled')}
                  onCheckedChange={(checked) => setValue('smsEnabled', checked)}
                  disabled={readOnly}
                />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <Label className="text-base">{t('notificationPolicy.doNotDisturb')}</Label>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label>{t('notificationPolicy.doNotDisturbMode')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('notificationPolicy.doNotDisturbDescription')}
                  </p>
                </div>
                <Switch
                  checked={quietHoursEnabled}
                  onCheckedChange={(checked) => setValue('quietHoursEnabled', checked)}
                  disabled={readOnly}
                />
              </div>

              {quietHoursEnabled && (
                <FormRow cols={2} className="pl-4">
                  <div className="space-y-2">
                    <Label>{t('notificationPolicy.startTime')}</Label>
                    <Input
                      type="time"
                      {...register('quietHoursStart')}
                      disabled={readOnly}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('notificationPolicy.endTime')}</Label>
                    <Input
                      type="time"
                      {...register('quietHoursEnd')}
                      disabled={readOnly}
                    />
                  </div>
                </FormRow>
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
