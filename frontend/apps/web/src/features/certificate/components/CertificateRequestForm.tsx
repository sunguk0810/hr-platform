import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { useCertificateTypes, useCreateCertificateRequest } from '../hooks/useCertificates';
import type { CertificateLanguage, CreateCertificateRequestRequest } from '@hr-platform/shared-types';
import { CERTIFICATE_LANGUAGE_LABELS } from '@hr-platform/shared-types';

interface CertificateRequestFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CertificateRequestForm({ open, onOpenChange, onSuccess }: CertificateRequestFormProps) {
  const { t } = useTranslation('certificate');
  const { data: typesData } = useCertificateTypes();
  const createMutation = useCreateCertificateRequest();

  const [formData, setFormData] = useState<{
    certificateTypeId: string;
    purpose: string;
    submissionTarget: string;
    copies: number;
    language: CertificateLanguage;
    includeSalary: boolean;
  }>({
    certificateTypeId: '',
    purpose: '',
    submissionTarget: '',
    copies: 1,
    language: 'KO',
    includeSalary: false,
  });

  const certificateTypes = typesData?.data ?? [];
  const selectedType = certificateTypes.find(t => t.id === formData.certificateTypeId);

  const handleSubmit = async () => {
    if (!formData.certificateTypeId) return;

    try {
      const data: CreateCertificateRequestRequest = {
        certificateTypeId: formData.certificateTypeId,
        purpose: formData.purpose || undefined,
        submissionTarget: formData.submissionTarget || undefined,
        copies: formData.copies,
        language: formData.language,
        includeSalary: formData.includeSalary,
      };
      await createMutation.mutateAsync(data);
      onOpenChange(false);
      resetForm();
      onSuccess?.();
    } catch (error) {
      console.error('Failed to create certificate request:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      certificateTypeId: '',
      purpose: '',
      submissionTarget: '',
      copies: 1,
      language: 'KO',
      includeSalary: false,
    });
  };

  const calculateFee = () => {
    if (!selectedType) return 0;
    return selectedType.fee * formData.copies;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('requestForm.title')}</DialogTitle>
          <DialogDescription>
            {t('requestForm.description')}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>{t('requestForm.typeLabel')}</Label>
            <Select
              value={formData.certificateTypeId}
              onValueChange={(value) =>
                setFormData(prev => ({ ...prev, certificateTypeId: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={t('requestForm.typePlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {certificateTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                    {type.fee > 0 && ` (${type.fee.toLocaleString()}${t('currencyUnit')})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedType && (
            <Card className="bg-muted/50">
              <CardContent className="p-3">
                <div className="text-sm space-y-1">
                  <p>{selectedType.description}</p>
                  <div className="flex gap-4 text-muted-foreground">
                    <span>{t('requestForm.validityPeriod')}{selectedType.validDays}{t('dayUnit')}</span>
                    <span>{t('requestForm.maxCopies')}{selectedType.maxCopiesPerRequest}{t('copyUnit')}</span>
                    {selectedType.requiresApproval && <span>{t('requestPage.approvalRequired')}</span>}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-2">
            <Label>{t('requestForm.languageLabel')}</Label>
            <Select
              value={formData.language}
              onValueChange={(value) =>
                setFormData(prev => ({ ...prev, language: value as CertificateLanguage }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CERTIFICATE_LANGUAGE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>{t('requestForm.copiesLabel')}</Label>
            <Input
              type="number"
              min={1}
              max={selectedType?.maxCopiesPerRequest ?? 10}
              value={formData.copies}
              onChange={(e) =>
                setFormData(prev => ({ ...prev, copies: parseInt(e.target.value) || 1 }))
              }
            />
          </div>

          <div className="grid gap-2">
            <Label>{t('requestForm.purposeLabel')}</Label>
            <Input
              value={formData.purpose}
              onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
              placeholder={t('requestForm.purposePlaceholder')}
            />
          </div>

          <div className="grid gap-2">
            <Label>{t('requestForm.recipientLabel')}</Label>
            <Input
              value={formData.submissionTarget}
              onChange={(e) =>
                setFormData(prev => ({ ...prev, submissionTarget: e.target.value }))
              }
              placeholder={t('requestForm.recipientPlaceholder')}
            />
          </div>

          {selectedType?.code === 'EMPLOYMENT' && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeSalary"
                checked={formData.includeSalary}
                onCheckedChange={(checked) =>
                  setFormData(prev => ({ ...prev, includeSalary: checked as boolean }))
                }
              />
              <Label htmlFor="includeSalary" className="text-sm font-normal">
                {t('requestForm.includeSalary')}
              </Label>
            </div>
          )}

          {selectedType && selectedType.fee > 0 && (
            <div className="rounded-md bg-muted p-3 text-sm">
              {t('requestForm.feeLabel')}<strong>{calculateFee().toLocaleString()}{t('currencyUnit')}</strong>
              {formData.copies > 1 && ` (${selectedType.fee.toLocaleString()}${t('currencyUnit')} × ${formData.copies}${t('copyUnit')})`}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              resetForm();
            }}
          >
            {t('requestForm.cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!formData.certificateTypeId || createMutation.isPending}
          >
            {createMutation.isPending ? t('requestForm.submitting') : t('requestForm.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
