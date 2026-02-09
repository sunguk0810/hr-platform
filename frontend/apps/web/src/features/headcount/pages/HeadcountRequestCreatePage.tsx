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
import { FileText, Save, Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useCreateHeadcountRequest } from '../hooks/useHeadcount';
import { useDepartmentList, useGrades } from '@/features/organization/hooks/useOrganization';
import type { HeadcountRequestType } from '@hr-platform/shared-types';
import { HEADCOUNT_REQUEST_TYPE_LABELS } from '@hr-platform/shared-types';

function createHeadcountRequestSchema(t: TFunction) {
  return z.object({
    type: z.enum(['INCREASE', 'DECREASE', 'TRANSFER'] as const, {
      required_error: t('requestValidation.typeRequired'),
    }),
    departmentId: z.string().min(1, t('requestValidation.departmentRequired')),
    gradeId: z.string().min(1, t('requestValidation.gradeRequired')),
    requestCount: z.coerce.number().min(0, t('requestValidation.countMin')),
    reason: z.string().min(1, t('requestValidation.reasonRequired')).max(500),
    effectiveDate: z.string().min(1, t('requestValidation.effectiveDateRequired')),
    remarks: z.string().max(1000).optional(),
  });
}

type HeadcountRequestFormData = z.infer<ReturnType<typeof createHeadcountRequestSchema>>;

export default function HeadcountRequestCreatePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { t } = useTranslation('headcount');

  const headcountRequestSchema = useMemo(() => createHeadcountRequestSchema(t), [t]);

  const createMutation = useCreateHeadcountRequest();
  const { data: departmentsData } = useDepartmentList();
  const { data: gradesData } = useGrades();

  const departments = departmentsData?.data?.content ?? [];
  const grades = gradesData?.data ?? [];

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<HeadcountRequestFormData>({
    resolver: zodResolver(headcountRequestSchema),
    defaultValues: {
      type: 'INCREASE',
      departmentId: '',
      gradeId: '',
      requestCount: 0,
      reason: '',
      effectiveDate: '',
      remarks: '',
    },
  });

  const onSubmit = async (data: HeadcountRequestFormData) => {
    try {
      await createMutation.mutateAsync({
        type: data.type,
        departmentId: data.departmentId,
        gradeId: data.gradeId,
        requestCount: data.requestCount,
        reason: data.reason,
        effectiveDate: data.effectiveDate,
        remarks: data.remarks || undefined,
      });

      toast({
        title: t('requestToast.success'),
        description: t('requestToast.successDesc'),
      });

      navigate('/headcount/requests');
    } catch {
      toast({
        title: t('requestToast.failed'),
        description: t('requestToast.failedDesc'),
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
            onClick={() => navigate('/headcount/requests')}
            className="p-2 -ml-2 rounded-full hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold">{t('request.title')}</h1>
            <p className="text-sm text-muted-foreground">{t('request.subtitle')}</p>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          {/* Request Info Section */}
          <div className="bg-card rounded-xl border p-4 space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {t('requestSection.info')}
            </h3>

            <div className="space-y-2">
              <Label htmlFor="mobile-type">{t('requestLabels.type')}</Label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="mobile-type">
                      <SelectValue placeholder={t('requestLabels.typeSelect')} />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.entries(HEADCOUNT_REQUEST_TYPE_LABELS) as [HeadcountRequestType, string][]).map(
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
              <Label htmlFor="mobile-departmentId">{t('requestLabels.department')}</Label>
              <Controller
                name="departmentId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="mobile-departmentId">
                      <SelectValue placeholder={t('requestLabels.departmentSelect')} />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.departmentId && (
                <p className="text-sm text-destructive">{errors.departmentId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile-gradeId">{t('requestLabels.grade')}</Label>
              <Controller
                name="gradeId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="mobile-gradeId">
                      <SelectValue placeholder={t('requestLabels.gradeSelect')} />
                    </SelectTrigger>
                    <SelectContent>
                      {grades.map((grade) => (
                        <SelectItem key={grade.id} value={grade.id}>
                          {grade.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.gradeId && (
                <p className="text-sm text-destructive">{errors.gradeId.message}</p>
              )}
            </div>
          </div>

          {/* Request Detail Section */}
          <div className="bg-card rounded-xl border p-4 space-y-4">
            <h3 className="text-sm font-medium">{t('requestSection.detail')}</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mobile-requestCount">{t('requestLabels.requestCount')}</Label>
                <Input
                  id="mobile-requestCount"
                  type="number"
                  min="0"
                  {...register('requestCount')}
                />
                {errors.requestCount && (
                  <p className="text-sm text-destructive">{errors.requestCount.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile-effectiveDate">{t('requestLabels.effectiveDate')}</Label>
                <Input
                  id="mobile-effectiveDate"
                  type="date"
                  {...register('effectiveDate')}
                />
                {errors.effectiveDate && (
                  <p className="text-sm text-destructive">{errors.effectiveDate.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile-reason">{t('requestLabels.reason')}</Label>
              <Textarea
                id="mobile-reason"
                {...register('reason')}
                placeholder={t('requestLabels.reasonPlaceholder')}
                rows={3}
              />
              {errors.reason && (
                <p className="text-sm text-destructive">{errors.reason.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile-remarks">{t('requestLabels.remarks')}</Label>
              <Textarea
                id="mobile-remarks"
                {...register('remarks')}
                placeholder={t('requestLabels.remarksPlaceholder')}
                rows={2}
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
              onClick={() => navigate('/headcount/requests')}
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
              {t('buttons.submit')}
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
        title={t('request.title')}
        description={t('request.description')}
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" aria-hidden="true" />
                {t('requestSection.info')}
              </CardTitle>
              <CardDescription>{t('requestSection.infoDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type">{t('requestLabels.type')}</Label>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="type">
                        <SelectValue placeholder={t('requestLabels.typeSelect')} />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.entries(HEADCOUNT_REQUEST_TYPE_LABELS) as [HeadcountRequestType, string][]).map(
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
                <Label htmlFor="departmentId">{t('requestLabels.department')}</Label>
                <Controller
                  name="departmentId"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="departmentId">
                        <SelectValue placeholder={t('requestLabels.departmentSelect')} />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.departmentId && (
                  <p className="text-sm text-destructive">{errors.departmentId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gradeId">{t('requestLabels.grade')}</Label>
                <Controller
                  name="gradeId"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="gradeId">
                        <SelectValue placeholder={t('requestLabels.gradeSelect')} />
                      </SelectTrigger>
                      <SelectContent>
                        {grades.map((grade) => (
                          <SelectItem key={grade.id} value={grade.id}>
                            {grade.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.gradeId && (
                  <p className="text-sm text-destructive">{errors.gradeId.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('requestSection.detail')}</CardTitle>
              <CardDescription>{t('requestSection.detailDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="requestCount">{t('requestLabels.requestCount')}</Label>
                  <Input
                    id="requestCount"
                    type="number"
                    min="0"
                    {...register('requestCount')}
                  />
                  {errors.requestCount && (
                    <p className="text-sm text-destructive">{errors.requestCount.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="effectiveDate">{t('requestLabels.effectiveDate')}</Label>
                  <Input
                    id="effectiveDate"
                    type="date"
                    {...register('effectiveDate')}
                  />
                  {errors.effectiveDate && (
                    <p className="text-sm text-destructive">{errors.effectiveDate.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">{t('requestLabels.reason')}</Label>
                <Textarea
                  id="reason"
                  {...register('reason')}
                  placeholder={t('requestLabels.reasonPlaceholder')}
                  rows={3}
                />
                {errors.reason && (
                  <p className="text-sm text-destructive">{errors.reason.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="remarks">{t('requestLabels.remarks')}</Label>
                <Textarea
                  id="remarks"
                  {...register('remarks')}
                  placeholder={t('requestLabels.remarksPlaceholder')}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/headcount/requests')}
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
            {t('buttons.submit')}
          </Button>
        </div>
      </form>
    </>
  );
}
