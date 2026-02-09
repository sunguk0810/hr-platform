import * as React from 'react';
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
import { Users2, Save, Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useCreateCommittee } from '../hooks/useCommittee';
import type { CommitteeType } from '@hr-platform/shared-types';
import { COMMITTEE_TYPE_LABELS } from '@hr-platform/shared-types';

function createCommitteeSchema(t: TFunction) {
  return z.object({
    code: z.string().min(1, t('validation.codeRequired')).max(20),
    name: z.string().min(1, t('validation.nameRequired')).max(100),
    type: z.enum(['PERMANENT', 'TEMPORARY', 'PROJECT'] as const, {
      required_error: t('validation.typeRequired'),
    }),
    purpose: z.string().min(1, t('validation.purposeRequired')).max(500),
    startDate: z.string().min(1, t('validation.startDateRequired')),
    endDate: z.string().optional(),
    meetingSchedule: z.string().max(200).optional(),
  });
}

type CommitteeFormData = z.infer<ReturnType<typeof createCommitteeSchema>>;

export default function CommitteeCreatePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { t } = useTranslation('committee');

  const committeeSchema = React.useMemo(() => createCommitteeSchema(t), [t]);

  const createMutation = useCreateCommittee();

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<CommitteeFormData>({
    resolver: zodResolver(committeeSchema),
    defaultValues: {
      code: '',
      name: '',
      type: 'PERMANENT',
      purpose: '',
      startDate: '',
      endDate: '',
      meetingSchedule: '',
    },
  });

  const selectedType = watch('type');

  const onSubmit = async (data: CommitteeFormData) => {
    try {
      await createMutation.mutateAsync({
        code: data.code,
        name: data.name,
        type: data.type,
        purpose: data.purpose,
        startDate: data.startDate,
        endDate: data.endDate || undefined,
        meetingSchedule: data.meetingSchedule || undefined,
      });

      toast({
        title: t('toast.createSuccess'),
        description: t('toast.createSuccessDesc'),
      });

      navigate('/committee');
    } catch {
      toast({
        title: t('toast.createFailed'),
        description: t('toast.createFailedDesc'),
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
            onClick={() => navigate('/committee')}
            className="p-2 -ml-2 rounded-full hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold">{t('create')}</h1>
            <p className="text-sm text-muted-foreground">{t('createPage.title')}</p>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          {/* 기본 정보 섹션 */}
          <div className="bg-card rounded-xl border p-4 space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Users2 className="h-4 w-4" />
              {t('section.basicInfo')}
            </h3>

            <div className="space-y-2">
              <Label htmlFor="mobile-code">{t('labels.code')}</Label>
              <Input
                id="mobile-code"
                {...register('code')}
                placeholder={t('labels.codePlaceholder')}
              />
              {errors.code && (
                <p className="text-sm text-destructive">{errors.code.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile-type">{t('labels.type')}</Label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="mobile-type">
                      <SelectValue placeholder={t('labels.typeSelect')} />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.entries(COMMITTEE_TYPE_LABELS) as [CommitteeType, string][]).map(
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
              {errors.type && (
                <p className="text-sm text-destructive">{errors.type.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile-name">{t('labels.name')}</Label>
              <Input
                id="mobile-name"
                {...register('name')}
                placeholder={t('labels.namePlaceholder')}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile-purpose">{t('labels.purpose')}</Label>
              <Textarea
                id="mobile-purpose"
                {...register('purpose')}
                placeholder={t('labels.purposePlaceholder')}
                rows={3}
              />
              {errors.purpose && (
                <p className="text-sm text-destructive">{errors.purpose.message}</p>
              )}
            </div>
          </div>

          {/* 활동 기간 섹션 */}
          <div className="bg-card rounded-xl border p-4 space-y-4">
            <h3 className="text-sm font-medium">{t('section.activityPeriod')}</h3>

            <div className="space-y-2">
              <Label htmlFor="mobile-startDate">{t('labels.startDate')}</Label>
              <Input
                id="mobile-startDate"
                type="date"
                {...register('startDate')}
              />
              {errors.startDate && (
                <p className="text-sm text-destructive">{errors.startDate.message}</p>
              )}
            </div>

            {(selectedType === 'TEMPORARY' || selectedType === 'PROJECT') && (
              <div className="space-y-2">
                <Label htmlFor="mobile-endDate">{t('labels.endDate')}</Label>
                <Input
                  id="mobile-endDate"
                  type="date"
                  {...register('endDate')}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="mobile-meetingSchedule">{t('labels.meetingSchedule')}</Label>
              <Input
                id="mobile-meetingSchedule"
                {...register('meetingSchedule')}
                placeholder={t('labels.meetingSchedulePlaceholder')}
              />
            </div>
          </div>
        </div>

        {/* Fixed Bottom Actions */}
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 pb-safe z-50">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/committee')}
              disabled={isPending}
              className="flex-1"
            >
              {t('buttons.cancel')}
            </Button>
            <Button type="submit" disabled={isPending} className="flex-1">
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {t('buttons.create')}
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
        title={t('create')}
        description={t('createPage.description')}
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users2 className="h-5 w-5" aria-hidden="true" />
                {t('section.basicInfo')}
              </CardTitle>
              <CardDescription>{t('section.basicInfoDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="code">{t('labels.code')}</Label>
                  <Input
                    id="code"
                    {...register('code')}
                    placeholder={t('labels.codePlaceholder')}
                  />
                  {errors.code && (
                    <p className="text-sm text-destructive">{errors.code.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">{t('labels.type')}</Label>
                  <Controller
                    name="type"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="type">
                          <SelectValue placeholder={t('labels.typeSelect')} />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.entries(COMMITTEE_TYPE_LABELS) as [CommitteeType, string][]).map(
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
                  {errors.type && (
                    <p className="text-sm text-destructive">{errors.type.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">{t('labels.name')}</Label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder={t('labels.namePlaceholder')}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="purpose">{t('labels.purpose')}</Label>
                <Textarea
                  id="purpose"
                  {...register('purpose')}
                  placeholder={t('labels.purposePlaceholder')}
                  rows={3}
                />
                {errors.purpose && (
                  <p className="text-sm text-destructive">{errors.purpose.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('section.activityPeriod')}</CardTitle>
              <CardDescription>{t('section.activityPeriodDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startDate">{t('labels.startDate')}</Label>
                  <Input
                    id="startDate"
                    type="date"
                    {...register('startDate')}
                  />
                  {errors.startDate && (
                    <p className="text-sm text-destructive">{errors.startDate.message}</p>
                  )}
                </div>

                {(selectedType === 'TEMPORARY' || selectedType === 'PROJECT') && (
                  <div className="space-y-2">
                    <Label htmlFor="endDate">{t('labels.endDate')}</Label>
                    <Input
                      id="endDate"
                      type="date"
                      {...register('endDate')}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="meetingSchedule">{t('labels.meetingSchedule')}</Label>
                <Input
                  id="meetingSchedule"
                  {...register('meetingSchedule')}
                  placeholder={t('labels.meetingSchedulePlaceholder')}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/committee')}
            disabled={isPending}
          >
            {t('buttons.cancel')}
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Save className="mr-2 h-4 w-4" aria-hidden="true" />
            )}
            {t('buttons.create')}
          </Button>
        </div>
      </form>
    </>
  );
}
