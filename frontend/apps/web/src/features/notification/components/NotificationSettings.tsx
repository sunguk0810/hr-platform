import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('notification');
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
            <CardTitle className="text-lg">{t('settings.channels.title')}</CardTitle>
            <CardDescription>
              {t('settings.channels.description')}
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
                      <FormLabel className="text-base">{t('settings.channels.email.label')}</FormLabel>
                      <FormDescription>
                        {t('settings.channels.email.description')}
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
                      <FormLabel className="text-base">{t('settings.channels.mobilePush.label')}</FormLabel>
                      <FormDescription>
                        {t('settings.channels.mobilePush.description')}
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
                      <FormLabel className="text-base">{t('settings.channels.browser.label')}</FormLabel>
                      <FormDescription>
                        {t('settings.channels.browser.description')}
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
            <CardTitle className="text-lg">{t('settings.categories.title')}</CardTitle>
            <CardDescription>
              {t('settings.categories.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="approvalNotifications"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <div>
                    <FormLabel>{t('settings.categories.approval.label')}</FormLabel>
                    <FormDescription>
                      {t('settings.categories.approval.description')}
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
                    <FormLabel>{t('settings.categories.leave.label')}</FormLabel>
                    <FormDescription>
                      {t('settings.categories.leave.description')}
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
                    <FormLabel>{t('settings.categories.announcement.label')}</FormLabel>
                    <FormDescription>
                      {t('settings.categories.announcement.description')}
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
                    <FormLabel>{t('settings.categories.reminder.label')}</FormLabel>
                    <FormDescription>
                      {t('settings.categories.reminder.description')}
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
                    <FormLabel>{t('settings.categories.system.label')}</FormLabel>
                    <FormDescription>
                      {t('settings.categories.system.description')}
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
            <CardTitle className="text-lg">{t('settings.additional.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="digestEnabled"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <div>
                    <FormLabel>{t('settings.additional.digest.label')}</FormLabel>
                    <FormDescription>
                      {t('settings.additional.digest.description')}
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
                    <FormLabel>{t('settings.additional.quietHours.label')}</FormLabel>
                    <FormDescription>
                      {t('settings.additional.quietHours.description')}
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
            {isLoading ? t('settings.saving') : t('settings.save')}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default NotificationSettings;
