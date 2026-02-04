import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Smartphone, Monitor } from 'lucide-react';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/common/Form';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const notificationSettingsSchema = z.object({
  // Channel settings
  emailEnabled: z.boolean(),
  pushEnabled: z.boolean(),
  browserEnabled: z.boolean(),
  smsEnabled: z.boolean(),

  // Category settings
  approvalNotifications: z.boolean(),
  leaveNotifications: z.boolean(),
  announcementNotifications: z.boolean(),
  reminderNotifications: z.boolean(),
  systemNotifications: z.boolean(),

  // Frequency settings
  digestEnabled: z.boolean(),
  quietHoursEnabled: z.boolean(),
});

type NotificationSettingsFormData = z.infer<typeof notificationSettingsSchema>;

interface NotificationSettingsProps {
  initialValues?: Partial<NotificationSettingsFormData>;
  onSave: (data: NotificationSettingsFormData) => void;
  isLoading?: boolean;
}

export function NotificationSettings({
  initialValues,
  onSave,
  isLoading,
}: NotificationSettingsProps) {
  const form = useForm<NotificationSettingsFormData>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: {
      emailEnabled: true,
      pushEnabled: true,
      browserEnabled: true,
      smsEnabled: false,
      approvalNotifications: true,
      leaveNotifications: true,
      announcementNotifications: true,
      reminderNotifications: true,
      systemNotifications: true,
      digestEnabled: false,
      quietHoursEnabled: false,
      ...initialValues,
    },
  });

  const handleSubmit = (values: NotificationSettingsFormData) => {
    onSave(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Notification Channels */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">알림 수신 채널</CardTitle>
            <CardDescription>
              알림을 받을 채널을 선택하세요
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="emailEnabled"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <FormLabel className="text-base">이메일</FormLabel>
                      <FormDescription>
                        이메일로 알림을 받습니다
                      </FormDescription>
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pushEnabled"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <FormLabel className="text-base">모바일 푸시</FormLabel>
                      <FormDescription>
                        모바일 앱으로 푸시 알림을 받습니다
                      </FormDescription>
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="browserEnabled"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <Monitor className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <FormLabel className="text-base">브라우저 알림</FormLabel>
                      <FormDescription>
                        브라우저에서 알림을 받습니다
                      </FormDescription>
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Notification Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">알림 유형</CardTitle>
            <CardDescription>
              받고 싶은 알림 유형을 선택하세요
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="approvalNotifications"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <div>
                    <FormLabel>결재 알림</FormLabel>
                    <FormDescription>
                      결재 요청 및 결과 알림
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <Separator />

            <FormField
              control={form.control}
              name="leaveNotifications"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <div>
                    <FormLabel>휴가 알림</FormLabel>
                    <FormDescription>
                      휴가 신청 및 결과 알림
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <Separator />

            <FormField
              control={form.control}
              name="announcementNotifications"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <div>
                    <FormLabel>공지사항</FormLabel>
                    <FormDescription>
                      새로운 공지사항 알림
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <Separator />

            <FormField
              control={form.control}
              name="reminderNotifications"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <div>
                    <FormLabel>리마인더</FormLabel>
                    <FormDescription>
                      일정 및 업무 리마인더
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <Separator />

            <FormField
              control={form.control}
              name="systemNotifications"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <div>
                    <FormLabel>시스템 알림</FormLabel>
                    <FormDescription>
                      시스템 점검 및 업데이트 알림
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Additional Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">추가 설정</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="digestEnabled"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <div>
                    <FormLabel>요약 알림</FormLabel>
                    <FormDescription>
                      매일 아침 전날 알림 요약을 받습니다
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <Separator />

            <FormField
              control={form.control}
              name="quietHoursEnabled"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <div>
                    <FormLabel>방해 금지 시간</FormLabel>
                    <FormDescription>
                      밤 10시 ~ 오전 8시에는 알림을 받지 않습니다
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? '저장 중...' : '설정 저장'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default NotificationSettings;
