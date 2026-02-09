import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/common/Form';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Info } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useCreatePrivacyAccessRequest } from '../hooks/useEmployees';
import type { Employee, PrivacyField } from '@hr-platform/shared-types';

const PRIVACY_FIELD_KEYS: PrivacyField[] = [
  'residentNumber',
  'bankAccount',
  'address',
  'mobile',
  'email',
  'birthDate',
  'phone',
];

const createPrivacyAccessRequestSchema = (t: TFunction) =>
  z.object({
    fields: z.array(z.string()).min(1, t('privacyAccessRequest.fieldsRequired')),
    purpose: z.string().min(10, t('privacyAccessRequest.purposeMinLength')).max(500, t('privacyAccessRequest.purposeMaxLength')),
  });

type PrivacyAccessRequestFormData = z.infer<ReturnType<typeof createPrivacyAccessRequestSchema>>;

interface PrivacyAccessRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee;
  onSuccess?: () => void;
}

export function PrivacyAccessRequestDialog({
  open,
  onOpenChange,
  employee,
  onSuccess,
}: PrivacyAccessRequestDialogProps) {
  const { t } = useTranslation('employee');
  const { toast } = useToast();
  const createMutation = useCreatePrivacyAccessRequest();

  const privacyAccessRequestSchema = React.useMemo(() => createPrivacyAccessRequestSchema(t), [t]);

  const form = useForm<PrivacyAccessRequestFormData>({
    resolver: zodResolver(privacyAccessRequestSchema),
    defaultValues: {
      fields: [],
      purpose: '',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        fields: [],
        purpose: '',
      });
    }
  }, [open, form]);

  const handleSubmit = async (values: PrivacyAccessRequestFormData) => {
    try {
      await createMutation.mutateAsync({
        targetEmployeeId: employee.id,
        fields: values.fields as PrivacyField[],
        purpose: values.purpose,
      });
      toast({
        title: t('privacyAccessRequest.successTitle'),
        description: t('privacyAccessRequest.successDescription'),
      });
      onOpenChange(false);
      onSuccess?.();
    } catch {
      toast({
        title: t('privacyAccessRequest.failureTitle'),
        description: t('privacyAccessRequest.failureDescription'),
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {t('privacyAccessRequest.title')}
          </DialogTitle>
          <DialogDescription>
            {t('privacyAccessRequest.description', { name: employee.name, employeeNumber: employee.employeeNumber })}
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            {t('privacyAccessRequest.notice')}
          </AlertDescription>
        </Alert>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fields"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel>{t('privacyAccessRequest.fieldsLabel')}</FormLabel>
                    <FormDescription>
                      {t('privacyAccessRequest.fieldsDescription')}
                    </FormDescription>
                  </div>
                  <div className="space-y-2">
                    {PRIVACY_FIELD_KEYS.map((fieldKey) => (
                      <FormField
                        key={fieldKey}
                        control={form.control}
                        name="fields"
                        render={({ field: formField }) => (
                          <FormItem
                            key={fieldKey}
                            className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3"
                          >
                            <FormControl>
                              <Checkbox
                                checked={formField.value?.includes(fieldKey)}
                                onCheckedChange={(checked) => {
                                  const current = formField.value || [];
                                  if (checked) {
                                    formField.onChange([...current, fieldKey]);
                                  } else {
                                    formField.onChange(
                                      current.filter((v) => v !== fieldKey)
                                    );
                                  }
                                }}
                              />
                            </FormControl>
                            <div className="flex-1 space-y-1 leading-none">
                              <FormLabel className="font-normal cursor-pointer">
                                {t(`privacyAccessRequest.privacyFields.${fieldKey}`)}
                              </FormLabel>
                              <p className="text-xs text-muted-foreground">
                                {t(`privacyAccessRequest.privacyFields.${fieldKey}Desc`)}
                              </p>
                            </div>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch('fields').length > 0 && (
              <div className="flex flex-wrap gap-1">
                <span className="text-sm text-muted-foreground">{t('common.selectedItems')}</span>
                {form.watch('fields').map((fieldValue) => (
                  <Badge key={fieldValue} variant="secondary">
                    {t(`privacyAccessRequest.privacyFields.${fieldValue}`)}
                  </Badge>
                ))}
              </div>
            )}

            <FormField
              control={form.control}
              name="purpose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('privacyAccessRequest.purposeLabel')}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder={t('privacyAccessRequest.purposePlaceholder')}
                      rows={4}
                    />
                  </FormControl>
                  <FormDescription>
                    {t('privacyAccessRequest.purposeDescription')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createMutation.isPending}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? t('common.requesting') : t('privacyAccessRequest.submitButton')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default PrivacyAccessRequestDialog;
