import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
              알림 정책
            </CardTitle>
            <CardDescription>알림 채널 및 방해 금지 설정</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label className="text-base">알림 채널</Label>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label>이메일 알림</Label>
                  <p className="text-sm text-muted-foreground">
                    이메일로 알림 발송
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
                  <Label>푸시 알림</Label>
                  <p className="text-sm text-muted-foreground">
                    브라우저 및 앱 푸시 알림
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
                  <Label>SMS 알림</Label>
                  <p className="text-sm text-muted-foreground">
                    문자 메시지 알림 (추가 비용 발생)
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
              <Label className="text-base">방해 금지</Label>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label>방해 금지 모드</Label>
                  <p className="text-sm text-muted-foreground">
                    지정된 시간에 알림 발송 차단
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
                    <Label>시작 시간</Label>
                    <Input
                      type="time"
                      {...register('quietHoursStart')}
                      disabled={readOnly}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>종료 시간</Label>
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
