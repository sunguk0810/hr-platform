import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { SkeletonCard } from '@/components/common/Skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { ArrowLeft, FileText, CheckCircle, Clock, Coins, Loader2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useCertificateTypes, useCreateCertificateRequest } from '../hooks/useCertificates';
import { useToast } from '@/hooks/useToast';
import type { CertificateLanguage, CreateCertificateRequestRequest } from '@hr-platform/shared-types';
import { CERTIFICATE_LANGUAGE_LABELS } from '@hr-platform/shared-types';

export default function CertificateRequestPage() {
  const { t } = useTranslation('certificate');
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { data: typesData, isLoading: isLoadingTypes } = useCertificateTypes();
  const createMutation = useCreateCertificateRequest();

  const [selectedTypeCode, setSelectedTypeCode] = useState<string>('');
  const [formData, setFormData] = useState({
    purpose: '',
    submissionTarget: '',
    copies: 1,
    language: 'KO' as CertificateLanguage,
    includeSalary: false,
  });

  const certificateTypes = typesData?.data ?? [];
  const selectedType = certificateTypes.find(t => t.code === selectedTypeCode);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTypeCode) {
      toast({
        title: t('requestToast.typeRequired'),
        description: t('requestToast.typeRequiredDesc'),
        variant: 'destructive',
      });
      return;
    }

    try {
      const data: CreateCertificateRequestRequest = {
        certificateTypeId: selectedType!.id,
        purpose: formData.purpose || undefined,
        submissionTarget: formData.submissionTarget || undefined,
        copies: formData.copies,
        language: formData.language,
        includeSalary: formData.includeSalary,
      };
      await createMutation.mutateAsync(data);
      toast({
        title: t('requestToast.success'),
        description: t('requestToast.successDesc'),
      });
      navigate('/certificates');
    } catch (error) {
      toast({
        title: t('requestToast.failed'),
        description: t('requestToast.failedDesc'),
        variant: 'destructive',
      });
    }
  };

  const calculateFee = () => {
    if (!selectedType) return 0;
    return selectedType.fee * formData.copies;
  };

  if (isLoadingTypes) {
    return (
      <>
        <PageHeader
          title={t('requestPage.title')}
          description={t('requestPage.description')}
        />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </>
    );
  }

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="space-y-4 pb-24">
        {/* Mobile Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/certificates')}
            className="p-2 -ml-2 rounded-full hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold">{t('requestPage.mobileTitle')}</h1>
            <p className="text-sm text-muted-foreground">{t('requestPage.mobileDescription')}</p>
          </div>
        </div>

        {certificateTypes.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={t('requestPage.emptyTitle')}
            description={t('requestPage.emptyDescription')}
          />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Certificate Type Selection */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium">{t('requestPage.typeSection')}</h3>
              {certificateTypes.map((type) => (
                <button
                  key={type.code}
                  type="button"
                  onClick={() => setSelectedTypeCode(type.code)}
                  className={`w-full bg-card rounded-xl border p-4 text-left transition-colors ${
                    selectedTypeCode === type.code
                      ? 'border-primary bg-primary/5'
                      : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{type.name}</h4>
                      {type.nameEn && (
                        <p className="text-xs text-muted-foreground">{type.nameEn}</p>
                      )}
                    </div>
                    {selectedTypeCode === type.code && (
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    )}
                  </div>
                  {type.description && (
                    <p className="mt-2 text-xs text-muted-foreground">{type.description}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {t('requestPage.validityDays', { days: type.validDays })}
                    </span>
                    {type.requiresApproval && (
                      <span className="text-orange-600 dark:text-orange-400">{t('requestPage.approvalRequired')}</span>
                    )}
                    {type.fee > 0 && (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Coins className="h-3 w-3" />
                        {type.fee.toLocaleString()}{t('currencyUnit')}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Request Options */}
            {selectedTypeCode && (
              <div className="bg-card rounded-xl border p-4 space-y-4">
                <h3 className="text-sm font-medium">{t('requestPage.requestInfo')}</h3>

                <div className="space-y-2">
                  <Label>{t('requestPage.languageLabel')}</Label>
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

                <div className="space-y-2">
                  <Label>{t('requestPage.copiesLabel')}</Label>
                  <Input
                    type="number"
                    min={1}
                    max={selectedType?.maxCopiesPerRequest ?? 10}
                    value={formData.copies}
                    onChange={(e) =>
                      setFormData(prev => ({
                        ...prev,
                        copies: Math.max(1, Math.min(parseInt(e.target.value) || 1, selectedType?.maxCopiesPerRequest ?? 10)),
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('requestPage.purposeLabel')}</Label>
                  <Input
                    value={formData.purpose}
                    onChange={(e) =>
                      setFormData(prev => ({ ...prev, purpose: e.target.value }))
                    }
                    placeholder={t('requestPage.purposePlaceholder')}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('requestPage.recipientLabel')}</Label>
                  <Input
                    value={formData.submissionTarget}
                    onChange={(e) =>
                      setFormData(prev => ({ ...prev, submissionTarget: e.target.value }))
                    }
                    placeholder={t('requestPage.recipientPlaceholder')}
                  />
                </div>

                {selectedTypeCode === 'EMPLOYMENT' && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="mobile-includeSalary"
                      checked={formData.includeSalary}
                      onCheckedChange={(checked) =>
                        setFormData(prev => ({ ...prev, includeSalary: checked as boolean }))
                      }
                    />
                    <Label htmlFor="mobile-includeSalary" className="text-sm font-normal">
                      {t('requestPage.includeSalary')}
                    </Label>
                  </div>
                )}

                {selectedType && selectedType.fee > 0 && (
                  <div className="rounded-lg bg-primary/10 p-3 text-sm">
                    {t('requestPage.feeLabel')}<strong className="text-primary">{calculateFee().toLocaleString()}{t('currencyUnit')}</strong>
                    {formData.copies > 1 && (
                      <span className="text-muted-foreground">
                        {' '}({selectedType.fee.toLocaleString()}{t('currencyUnit')} × {formData.copies}{t('copyUnit')})
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Fixed Bottom Actions */}
            <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 pb-safe z-50">
              <Button
                type="submit"
                className="w-full"
                disabled={!selectedTypeCode || createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {createMutation.isPending ? t('requestPage.submitting') : t('requestPage.submit')}
              </Button>
            </div>
          </form>
        )}
      </div>
    );
  }

  // Desktop Layout
  return (
    <>
      <PageHeader
        title={t('requestPage.title')}
        description={t('requestPage.description')}
        actions={
          <Button variant="outline" onClick={() => navigate('/certificates')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('goToList')}
          </Button>
        }
      />

      {certificateTypes.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={t('requestPage.emptyTitle')}
          description={t('requestPage.emptyDescription')}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Certificate Types Selection */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('requestPage.typeSelectTitle')}</CardTitle>
                <CardDescription>{t('requestPage.typeSelectDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  {certificateTypes.map((type) => (
                    <Card
                      key={type.code}
                      className={`cursor-pointer transition-colors ${
                        selectedTypeCode === type.code
                          ? 'border-primary bg-primary/5'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedTypeCode(type.code)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">{type.name}</h4>
                            {type.nameEn && (
                              <p className="text-xs text-muted-foreground">{type.nameEn}</p>
                            )}
                          </div>
                          {selectedTypeCode === type.code && (
                            <CheckCircle className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        {type.description && (
                          <p className="mt-2 text-sm text-muted-foreground">
                            {type.description}
                          </p>
                        )}
                        <div className="mt-3 flex flex-wrap gap-2 text-xs">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {t('requestPage.validityDays', { days: type.validDays })}
                          </span>
                          {type.requiresApproval && (
                            <span className="text-orange-600 dark:text-orange-400">
                              {t('requestPage.approvalRequired')}
                            </span>
                          )}
                          {type.fee > 0 && (
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Coins className="h-3 w-3" />
                              {type.fee.toLocaleString()}{t('currencyUnit')}
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Request Form */}
          <div>
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>{t('requestPage.requestInfo')}</CardTitle>
                <CardDescription>
                  {selectedType ? selectedType.name : t('requestPage.selectCertificate')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-2">
                    <Label>{t('requestPage.languageLabel')}</Label>
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
                    <Label>{t('requestPage.copiesLabel')}</Label>
                    <Input
                      type="number"
                      min={1}
                      max={selectedType?.maxCopiesPerRequest ?? 10}
                      value={formData.copies}
                      onChange={(e) =>
                        setFormData(prev => ({
                          ...prev,
                          copies: Math.max(1, Math.min(parseInt(e.target.value) || 1, selectedType?.maxCopiesPerRequest ?? 10)),
                        }))
                      }
                    />
                    {selectedType && (
                      <p className="text-xs text-muted-foreground">
                        {t('requestPage.maxCopies', { max: selectedType.maxCopiesPerRequest })}
                      </p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label>{t('requestPage.purposeLabel')}</Label>
                    <Input
                      value={formData.purpose}
                      onChange={(e) =>
                        setFormData(prev => ({ ...prev, purpose: e.target.value }))
                      }
                      placeholder={t('requestPage.purposePlaceholder')}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>{t('requestPage.recipientLabel')}</Label>
                    <Input
                      value={formData.submissionTarget}
                      onChange={(e) =>
                        setFormData(prev => ({ ...prev, submissionTarget: e.target.value }))
                      }
                      placeholder={t('requestPage.recipientPlaceholder')}
                    />
                  </div>

                  {selectedTypeCode === 'EMPLOYMENT' && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="includeSalary"
                        checked={formData.includeSalary}
                        onCheckedChange={(checked) =>
                          setFormData(prev => ({ ...prev, includeSalary: checked as boolean }))
                        }
                      />
                      <Label htmlFor="includeSalary" className="text-sm font-normal">
                        {t('requestPage.includeSalary')}
                      </Label>
                    </div>
                  )}

                  {selectedType && selectedType.fee > 0 && (
                    <div className="rounded-md bg-muted p-3 text-sm">
                      {t('requestPage.feeLabel')}<strong>{calculateFee().toLocaleString()}{t('currencyUnit')}</strong>
                      {formData.copies > 1 && (
                        <span className="text-muted-foreground">
                          {' '}({selectedType.fee.toLocaleString()}{t('currencyUnit')} × {formData.copies}{t('copyUnit')})
                        </span>
                      )}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={!selectedTypeCode || createMutation.isPending}
                  >
                    {createMutation.isPending ? t('requestPage.submitting') : t('requestPage.submit')}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
