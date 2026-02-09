import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Heart, Save, Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useCreateCondolenceRequest, useCondolencePolicies } from '../hooks/useCondolence';
import type { CondolenceType } from '@hr-platform/shared-types';
import { CONDOLENCE_TYPE_LABELS } from '@hr-platform/shared-types';

const createCondolenceSchema = (t: TFunction) => z.object({
  eventType: z.enum([
    'MARRIAGE',
    'CHILDBIRTH',
    'FIRST_BIRTHDAY',
    'DEATH_PARENT',
    'DEATH_SPOUSE',
    'DEATH_CHILD',
    'DEATH_SIBLING',
    'DEATH_GRANDPARENT',
    'HOSPITALIZATION',
    'OTHER',
  ] as const, {
    required_error: t('createValidation.typeRequired'),
  }),
  relatedPersonName: z.string().min(1, t('createValidation.targetNameRequired')).max(50),
  relation: z.string().min(1, t('createValidation.relationRequired')).max(50),
  eventDate: z.string().min(1, t('createValidation.eventDateRequired')),
  description: z.string().min(1, t('createValidation.detailRequired')).max(500),
});

type CondolenceFormData = z.infer<ReturnType<typeof createCondolenceSchema>>;

export default function CondolenceCreatePage() {
  const { t } = useTranslation('condolence');
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const condolenceSchema = useMemo(() => createCondolenceSchema(t), [t]);

  const createMutation = useCreateCondolenceRequest();
  const { data: policiesData } = useCondolencePolicies();

  const policies = policiesData?.data ?? [];

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<CondolenceFormData>({
    resolver: zodResolver(condolenceSchema),
    defaultValues: {
      eventType: 'MARRIAGE',
      relatedPersonName: '',
      relation: '',
      eventDate: '',
      description: '',
    },
  });

  const selectedType = watch('eventType');
  const selectedPolicy = policies.find((p) => p.eventType === selectedType);

  const onSubmit = async (data: CondolenceFormData) => {
    try {
      await createMutation.mutateAsync({
        eventType: data.eventType,
        relatedPersonName: data.relatedPersonName,
        relation: data.relation,
        eventDate: data.eventDate,
        description: data.description,
      });

      toast({
        title: t('createToast.success'),
        description: t('createToast.successDesc'),
      });

      navigate('/condolence');
    } catch {
      toast({
        title: t('createToast.failed'),
        description: t('createToast.failedDesc'),
        variant: 'destructive',
      });
    }
  };

  const isPending = createMutation.isPending;

  // Mobile Layout
  if (isMobile) {
    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pb-24">
        {/* Mobile Header */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/condolence')}
            className="p-2 -ml-2 rounded-full hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold">{t('createPage.title')}</h1>
            <p className="text-sm text-muted-foreground">{t('createPage.description')}</p>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          {/* Event Info Section */}
          <div className="bg-card rounded-xl border p-4 space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Heart className="h-4 w-4" />
              {t('createPage.eventInfo')}
            </h3>

            <div className="space-y-2">
              <Label htmlFor="mobile-type">{t('createPage.typeLabel')}</Label>
              <Controller
                name="eventType"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="mobile-type">
                      <SelectValue placeholder={t('createPage.typePlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.entries(CONDOLENCE_TYPE_LABELS) as [CondolenceType, string][]).map(
                        ([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.eventType && (
                <p className="text-sm text-destructive">{errors.eventType.message}</p>
              )}
            </div>

            {/* Policy Info Card */}
            {selectedPolicy && (
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                <p className="text-sm font-medium text-primary mb-2">{t('createPage.policyInfo')}</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-background/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">{t('createPage.paymentAmount')}</p>
                    <p className="text-lg font-bold text-primary">
                      {selectedPolicy.amount.toLocaleString()}{t('createPage.currencyUnit')}
                    </p>
                  </div>
                  <div className="bg-background/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">{t('createPage.leaveLabel')}</p>
                    <p className="text-lg font-bold text-primary">
                      {selectedPolicy.leaveDays}{t('createPage.dayUnit')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="mobile-eventDate">{t('createPage.eventDateLabel')}</Label>
              <Input
                id="mobile-eventDate"
                type="date"
                {...register('eventDate')}
              />
              {errors.eventDate && (
                <p className="text-sm text-destructive">{errors.eventDate.message}</p>
              )}
            </div>
          </div>

          {/* Target Info Section */}
          <div className="bg-card rounded-xl border p-4 space-y-4">
            <h3 className="text-sm font-medium">{t('createPage.targetInfo')}</h3>

            <div className="space-y-2">
              <Label htmlFor="mobile-relatedPersonName">{t('createPage.targetNameLabel')}</Label>
              <Input
                id="mobile-relatedPersonName"
                {...register('relatedPersonName')}
                placeholder={t('createPage.targetNamePlaceholder')}
              />
              {errors.relatedPersonName && (
                <p className="text-sm text-destructive">{errors.relatedPersonName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile-relation">{t('createPage.relationLabel')}</Label>
              <Input
                id="mobile-relation"
                {...register('relation')}
                placeholder={t('createPage.relationPlaceholder')}
              />
              {errors.relation && (
                <p className="text-sm text-destructive">{errors.relation.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile-description">{t('createPage.detailLabel')}</Label>
              <Textarea
                id="mobile-description"
                {...register('description')}
                placeholder={t('createPage.detailPlaceholder')}
                rows={4}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Fixed Bottom Actions */}
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 pb-safe z-50">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/condolence')}
              disabled={isPending}
              className="flex-1"
            >
              {t('createPage.cancel')}
            </Button>
            <Button type="submit" disabled={isPending} className="flex-1">
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {t('createPage.submit')}
            </Button>
          </div>
        </div>
      </form>
    );
  }

  // Desktop Layout
  return (
    <>
      <PageHeader
        title={t('createPage.title')}
        description={t('createPage.description')}
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" aria-hidden="true" />
                {t('createPage.eventInfo')}
              </CardTitle>
              <CardDescription>{t('createPage.eventInfoDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="eventType">{t('createPage.typeLabel')}</Label>
                <Controller
                  name="eventType"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="eventType">
                        <SelectValue placeholder={t('createPage.typePlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.entries(CONDOLENCE_TYPE_LABELS) as [CondolenceType, string][]).map(
                          ([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.eventType && (
                  <p className="text-sm text-destructive">{errors.eventType.message}</p>
                )}
              </div>

              {selectedPolicy && (
                <div className="p-3 rounded-md bg-muted">
                  <p className="text-sm font-medium">{t('createPage.policyInfo')}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('createPage.paymentAmountLabel')} {selectedPolicy.amount.toLocaleString()}{t('createPage.currencyUnit')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t('createPage.leaveLabelColon')} {selectedPolicy.leaveDays}{t('createPage.dayUnit')}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="eventDate">{t('createPage.eventDateLabel')}</Label>
                <Input
                  id="eventDate"
                  type="date"
                  {...register('eventDate')}
                />
                {errors.eventDate && (
                  <p className="text-sm text-destructive">{errors.eventDate.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('createPage.targetInfo')}</CardTitle>
              <CardDescription>{t('createPage.targetInfoDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="relatedPersonName">{t('createPage.targetNameLabel')}</Label>
                <Input
                  id="relatedPersonName"
                  {...register('relatedPersonName')}
                  placeholder={t('createPage.targetNamePlaceholder')}
                />
                {errors.relatedPersonName && (
                  <p className="text-sm text-destructive">{errors.relatedPersonName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="relation">{t('createPage.relationLabel')}</Label>
                <Input
                  id="relation"
                  {...register('relation')}
                  placeholder={t('createPage.relationPlaceholder')}
                />
                {errors.relation && (
                  <p className="text-sm text-destructive">{errors.relation.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t('createPage.detailLabel')}</Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  placeholder={t('createPage.detailPlaceholder')}
                  rows={4}
                />
                {errors.description && (
                  <p className="text-sm text-destructive">{errors.description.message}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/condolence')}
            disabled={isPending}
          >
            {t('createPage.cancel')}
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Save className="mr-2 h-4 w-4" aria-hidden="true" />
            )}
            {t('createPage.submit')}
          </Button>
        </div>
      </form>
    </>
  );
}
