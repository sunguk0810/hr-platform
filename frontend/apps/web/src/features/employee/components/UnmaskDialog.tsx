import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useUnmask } from '../hooks/useEmployees';
import { useToast } from '@/hooks/useToast';
import type { PrivacyField, UnmaskRequest, UnmaskResponse, Employee } from '@hr-platform/shared-types';
import { Eye, AlertTriangle, Shield, Clock } from 'lucide-react';

interface UnmaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee;
}

interface FormData {
  purpose: string;
}

const privacyFieldKeys: { value: PrivacyField; labelKey: string; descKey: string }[] = [
  { value: 'residentNumber', labelKey: 'unmaskDialog.privacyFields.residentNumber', descKey: 'unmaskDialog.privacyFields.residentNumberDesc' },
  { value: 'bankAccount', labelKey: 'unmaskDialog.privacyFields.bankAccount', descKey: 'unmaskDialog.privacyFields.bankAccountDesc' },
  { value: 'address', labelKey: 'unmaskDialog.privacyFields.address', descKey: 'unmaskDialog.privacyFields.addressDesc' },
  { value: 'mobile', labelKey: 'unmaskDialog.privacyFields.mobile', descKey: 'unmaskDialog.privacyFields.mobileDesc' },
  { value: 'phone', labelKey: 'unmaskDialog.privacyFields.phone', descKey: 'unmaskDialog.privacyFields.phoneDesc' },
  { value: 'birthDate', labelKey: 'unmaskDialog.privacyFields.birthDate', descKey: 'unmaskDialog.privacyFields.birthDateDesc' },
];

export function UnmaskDialog({ open, onOpenChange, employee }: UnmaskDialogProps) {
  const { t } = useTranslation('employee');
  const { toast } = useToast();
  const unmaskMutation = useUnmask();
  const [selectedFields, setSelectedFields] = useState<PrivacyField[]>([]);
  const [unmaskedData, setUnmaskedData] = useState<UnmaskResponse | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      purpose: '',
    },
  });

  const toggleField = (field: PrivacyField) => {
    setSelectedFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]
    );
  };

  const onSubmit = async (data: FormData) => {
    if (selectedFields.length === 0) {
      toast({
        title: t('unmaskDialog.selectionRequired'),
        description: t('unmaskDialog.selectRequired'),
        variant: 'destructive',
      });
      return;
    }

    const request: UnmaskRequest = {
      fields: selectedFields,
      purpose: data.purpose,
    };

    try {
      const response = await unmaskMutation.mutateAsync({ id: employee.id, data: request });
      setUnmaskedData(response.data);
      toast({
        title: t('unmaskDialog.approvedTitle'),
        description: t('unmaskDialog.approvedDescription'),
      });
    } catch {
      toast({
        title: t('unmaskDialog.failureTitle'),
        description: t('unmaskDialog.failureDescription'),
        variant: 'destructive',
      });
    }
  };

  const handleClose = () => {
    reset();
    setSelectedFields([]);
    setUnmaskedData(null);
    onOpenChange(false);
  };

  const formatValidUntil = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {t('unmaskDialog.title')}
          </DialogTitle>
          <DialogDescription>
            {t('unmaskDialog.description', { name: employee.name, employeeNumber: employee.employeeNumber })}
          </DialogDescription>
        </DialogHeader>

        {!unmaskedData ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Alert variant="default" className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertTitle className="text-yellow-800 dark:text-yellow-200">{t('unmaskDialog.warningTitle')}</AlertTitle>
              <AlertDescription className="text-yellow-700 dark:text-yellow-300 text-sm">
                {t('unmaskDialog.warningDescription')}
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <Label>{t('unmaskDialog.selectFieldsLabel')}</Label>
              <div className="grid grid-cols-2 gap-3">
                {privacyFieldKeys.map((option) => (
                  <div
                    key={option.value}
                    className={`flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedFields.includes(option.value)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => toggleField(option.value)}
                  >
                    <Checkbox
                      checked={selectedFields.includes(option.value)}
                      onCheckedChange={() => toggleField(option.value)}
                    />
                    <div className="grid gap-0.5">
                      <Label className="font-normal cursor-pointer">{t(option.labelKey)}</Label>
                      <p className="text-xs text-muted-foreground">{t(option.descKey)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="purpose">{t('unmaskDialog.purposeLabel')}</Label>
              <Textarea
                id="purpose"
                placeholder={t('unmaskDialog.purposePlaceholder')}
                rows={3}
                {...register('purpose', {
                  required: t('unmaskDialog.purposeRequired'),
                  minLength: { value: 10, message: t('unmaskDialog.purposeMinLength') },
                })}
              />
              {errors.purpose && (
                <p className="text-sm text-destructive">{errors.purpose.message}</p>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={handleClose}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={unmaskMutation.isPending}>
                {unmaskMutation.isPending ? t('common.requesting') : t('unmaskDialog.submitButton')}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{t('unmaskDialog.validUntil', { time: formatValidUntil(unmaskedData.validUntil) })}</span>
            </div>

            <div className="space-y-3">
              {selectedFields.map((field) => {
                const option = privacyFieldKeys.find((o) => o.value === field);
                const value = unmaskedData.data[field];
                return (
                  <div key={field} className="p-3 rounded-lg border bg-muted/30">
                    <div className="flex items-center gap-2 mb-1">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{option ? t(option.labelKey) : field}</span>
                    </div>
                    <p className="font-mono text-sm pl-6">{value || '-'}</p>
                  </div>
                );
              })}
            </div>

            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {t('unmaskDialog.accessLogSaved')}
                <br />
                {t('unmaskDialog.logId', { id: unmaskedData.accessLogId })}
              </AlertDescription>
            </Alert>

            <DialogFooter>
              <Button onClick={handleClose}>{t('common.close')}</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
