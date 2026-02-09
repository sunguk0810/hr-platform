import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import * as React from 'react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/common/Form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileUpload } from '@/components/common/FileUpload';
import { AlertCircle } from 'lucide-react';

const createChangeRequestSchema = (t: TFunction) =>
  z.object({
    changeType: z.string().min(1, t('changeRequest.changeTypeRequired')),
    fieldName: z.string().min(1, t('changeRequest.fieldNameRequired')),
    currentValue: z.string().optional(),
    newValue: z.string().min(1, t('changeRequest.newValueRequired')),
    reason: z.string().min(10, t('changeRequest.reasonRequired')),
    attachments: z.array(z.any()).optional(),
  });

type ChangeRequestFormData = z.infer<ReturnType<typeof createChangeRequestSchema>>;

interface ChangeRequestFormProps {
  employeeId: string;
  employeeName: string;
  currentValues?: Record<string, string>;
  onSubmit: (data: ChangeRequestFormData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

const CHANGE_TYPE_KEYS = [
  'BASIC_INFO',
  'CONTACT',
  'ADDRESS',
  'BANK_ACCOUNT',
  'FAMILY',
  'EDUCATION',
  'CERTIFICATE',
  'OTHER',
] as const;

const FIELD_OPTIONS_KEYS: Record<string, string[]> = {
  BASIC_INFO: ['name', 'nameEn', 'birthDate'],
  CONTACT: ['mobile', 'email', 'emergencyContact'],
  ADDRESS: ['address', 'zipCode'],
  BANK_ACCOUNT: ['bankName', 'accountNumber', 'accountHolder'],
  OTHER: ['other'],
};

export function ChangeRequestForm({
  employeeName,
  currentValues = {},
  onSubmit,
  onCancel,
  isLoading,
}: ChangeRequestFormProps) {
  const { t } = useTranslation('employee');

  const changeRequestSchema = React.useMemo(() => createChangeRequestSchema(t), [t]);

  const form = useForm<ChangeRequestFormData>({
    resolver: zodResolver(changeRequestSchema),
    defaultValues: {
      changeType: '',
      fieldName: '',
      currentValue: '',
      newValue: '',
      reason: '',
      attachments: [],
    },
  });

  const selectedChangeType = form.watch('changeType');

  const availableFieldKeys = selectedChangeType
    ? FIELD_OPTIONS_KEYS[selectedChangeType] || FIELD_OPTIONS_KEYS.OTHER
    : [];

  const handleChangeTypeChange = (value: string) => {
    form.setValue('changeType', value);
    form.setValue('fieldName', '');
    form.setValue('currentValue', '');
  };

  const handleFieldChange = (value: string) => {
    form.setValue('fieldName', value);
    form.setValue('currentValue', currentValues[value] || '');
  };

  const handleSubmit = (values: ChangeRequestFormData) => {
    onSubmit(values);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('changeRequest.title')}</CardTitle>
        <CardDescription>
          {t('changeRequest.description', { name: employeeName })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />
                <div className="text-sm text-amber-800 dark:text-amber-200">
                  <p className="font-medium">{t('changeRequest.noticeTitle')}</p>
                  <ul className="mt-1 list-inside list-disc space-y-1 text-amber-700 dark:text-amber-300">
                    <li>{t('changeRequest.notice1')}</li>
                    <li>{t('changeRequest.notice2')}</li>
                    <li>{t('changeRequest.notice3')}</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="changeType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('changeRequest.changeType')}</FormLabel>
                    <Select
                      onValueChange={handleChangeTypeChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('changeRequest.changeTypePlaceholder')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CHANGE_TYPE_KEYS.map((key) => (
                          <SelectItem key={key} value={key}>
                            {t(`changeRequest.changeTypeOptions.${key}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fieldName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('changeRequest.fieldName')}</FormLabel>
                    <Select
                      onValueChange={handleFieldChange}
                      value={field.value}
                      disabled={!selectedChangeType}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('changeRequest.fieldNamePlaceholder')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableFieldKeys.map((key) => (
                          <SelectItem key={key} value={key}>
                            {t(`changeRequest.fieldOptions.${key}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="currentValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('changeRequest.currentValue')}</FormLabel>
                    <FormControl>
                      <Input {...field} disabled />
                    </FormControl>
                    <FormDescription>{t('changeRequest.currentValueDescription')}</FormDescription>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="newValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('changeRequest.newValue')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t('changeRequest.newValuePlaceholder')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('changeRequest.reasonLabel')}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={4}
                      placeholder={t('changeRequest.reasonPlaceholder')}
                    />
                  </FormControl>
                  <FormDescription>
                    {t('changeRequest.reasonDescription')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="attachments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('changeRequest.attachments')}</FormLabel>
                  <FormControl>
                    <FileUpload
                      value={field.value || []}
                      onChange={field.onChange}
                      accept=".pdf,.jpg,.jpeg,.png"
                      maxFiles={5}
                      maxSize={10 * 1024 * 1024}
                    />
                  </FormControl>
                  <FormDescription>
                    {t('changeRequest.attachmentsDescription')}
                  </FormDescription>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  {t('common.cancel')}
                </Button>
              )}
              <Button type="submit" disabled={isLoading}>
                {isLoading ? t('common.submitting') : t('changeRequest.submitButton')}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export default ChangeRequestForm;
