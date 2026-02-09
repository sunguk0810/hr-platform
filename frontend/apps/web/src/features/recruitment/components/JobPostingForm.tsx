import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { format, addMonths } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type {
  JobPosting,
  CreateJobPostingRequest,
  UpdateJobPostingRequest,
  RecruitmentEmploymentType,
} from '@hr-platform/shared-types';
import { showErrorToast } from '@/components/common/Error/ErrorToast';

const EMPLOYMENT_TYPE_KEYS: { value: RecruitmentEmploymentType; key: string }[] = [
  { value: 'FULL_TIME', key: 'jobPostingForm.employmentTypes.fullTime' },
  { value: 'CONTRACT', key: 'jobPostingForm.employmentTypes.contract' },
  { value: 'INTERN', key: 'jobPostingForm.employmentTypes.intern' },
  { value: 'PART_TIME', key: 'jobPostingForm.employmentTypes.partTime' },
];

interface JobPostingFormProps {
  initialData?: JobPosting;
  onSubmit: (data: CreateJobPostingRequest | UpdateJobPostingRequest) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

interface FormData {
  title: string;
  departmentId: string;
  positionId: string;
  employmentType: RecruitmentEmploymentType;
  jobDescription: string;
  requirements: string;
  preferredQualifications: string;
  salaryMin: string;
  salaryMax: string;
  salaryNegotiable: boolean;
  headcount: string;
  workLocation: string;
  openDate: string;
  closeDate: string;
}

export function JobPostingForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: JobPostingFormProps) {
  const { t } = useTranslation('recruitment');
  const isEditMode = !!initialData;

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      title: '',
      departmentId: '',
      positionId: '',
      employmentType: 'FULL_TIME',
      jobDescription: '',
      requirements: '',
      preferredQualifications: '',
      salaryMin: '',
      salaryMax: '',
      salaryNegotiable: false,
      headcount: '1',
      workLocation: '',
      openDate: format(new Date(), 'yyyy-MM-dd'),
      closeDate: format(addMonths(new Date(), 1), 'yyyy-MM-dd'),
    },
  });

  useEffect(() => {
    if (initialData) {
      setValue('title', initialData.title);
      setValue('departmentId', initialData.departmentId);
      setValue('positionId', initialData.positionId || '');
      setValue('employmentType', initialData.employmentType);
      setValue('jobDescription', initialData.jobDescription);
      setValue('requirements', initialData.requirements || '');
      setValue('preferredQualifications', initialData.preferredQualifications || '');
      setValue('salaryMin', initialData.salaryMin?.toString() || '');
      setValue('salaryMax', initialData.salaryMax?.toString() || '');
      setValue('salaryNegotiable', initialData.salaryNegotiable || false);
      setValue('headcount', initialData.headcount.toString());
      setValue('workLocation', initialData.workLocation || '');
      setValue('openDate', initialData.openDate.split('T')[0]);
      setValue('closeDate', initialData.closeDate.split('T')[0]);
    }
  }, [initialData, setValue]);

  const isSalaryNegotiable = watch('salaryNegotiable');

  const validateSalaryRange = (salaryMin: string, salaryMax: string): string | null => {
    if (!salaryMin || !salaryMax) return null;
    const min = parseInt(salaryMin);
    const max = parseInt(salaryMax);
    if (min > max) {
      return t('jobPostingForm.validation.salaryMinExceedsMax');
    }
    return null;
  };

  const validateDateRange = (startDate: string, endDate: string): string | null => {
    if (!startDate || !endDate) return null;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) {
      return t('jobPostingForm.validation.startDateAfterEnd');
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (end < today) {
      return t('jobPostingForm.validation.endDateBeforeToday');
    }
    return null;
  };

  const handleFormSubmit = (data: FormData) => {
    // 급여 범위 검증
    if (!data.salaryNegotiable) {
      const salaryError = validateSalaryRange(data.salaryMin, data.salaryMax);
      if (salaryError) {
        showErrorToast(salaryError);
        return;
      }
    }

    // 날짜 범위 검증
    const dateError = validateDateRange(data.openDate, data.closeDate);
    if (dateError) {
      showErrorToast(dateError);
      return;
    }

    const payload: CreateJobPostingRequest = {
      title: data.title,
      departmentId: data.departmentId,
      positionId: data.positionId || undefined,
      employmentType: data.employmentType,
      jobDescription: data.jobDescription,
      requirements: data.requirements || undefined,
      preferredQualifications: data.preferredQualifications || undefined,
      salaryMin: data.salaryMin ? parseInt(data.salaryMin) : undefined,
      salaryMax: data.salaryMax ? parseInt(data.salaryMax) : undefined,
      salaryNegotiable: data.salaryNegotiable,
      headcount: parseInt(data.headcount),
      workLocation: data.workLocation || undefined,
      openDate: data.openDate,
      closeDate: data.closeDate,
    };
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('jobPostingForm.basicInfo')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="title">{t('jobPostingForm.postingTitle')}</Label>
              <Input
                id="title"
                placeholder={t('jobPostingForm.postingTitlePlaceholder')}
                {...register('title', { required: t('jobPostingForm.validation.titleRequired') })}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="departmentId">{t('jobPostingForm.hiringDepartment')}</Label>
              <Controller
                control={control}
                name="departmentId"
                rules={{ required: t('jobPostingForm.validation.departmentRequired') }}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full h-10">
                      <SelectValue placeholder={t('common.select')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dept-001">개발팀</SelectItem>
                      <SelectItem value="dept-002">인사팀</SelectItem>
                      <SelectItem value="dept-003">재무팀</SelectItem>
                      <SelectItem value="dept-004">마케팅팀</SelectItem>
                      <SelectItem value="dept-005">디자인팀</SelectItem>
                      <SelectItem value="dept-006">영업팀</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.departmentId && (
                <p className="text-sm text-destructive">{errors.departmentId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="positionId">{t('jobPostingForm.position')}</Label>
              <Controller
                control={control}
                name="positionId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full h-10">
                      <SelectValue placeholder={t('jobPostingForm.positionOptional')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">{t('jobPostingForm.positionOptional')}</SelectItem>
                      <SelectItem value="pos-001">팀장</SelectItem>
                      <SelectItem value="pos-002">선임</SelectItem>
                      <SelectItem value="pos-003">매니저</SelectItem>
                      <SelectItem value="pos-004">주임</SelectItem>
                      <SelectItem value="pos-005">책임</SelectItem>
                      <SelectItem value="pos-006">사원</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="employmentType">{t('jobPostingForm.employmentType')}</Label>
              <Controller
                control={control}
                name="employmentType"
                rules={{ required: true }}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EMPLOYMENT_TYPE_KEYS.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {t(type.key)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="headcount">{t('jobPostingForm.headcount')}</Label>
              <Input
                id="headcount"
                type="number"
                min="1"
                {...register('headcount', {
                  required: t('jobPostingForm.validation.headcountRequired'),
                  min: { value: 1, message: t('jobPostingForm.validation.headcountMin') },
                })}
              />
              {errors.headcount && (
                <p className="text-sm text-destructive">{errors.headcount.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="workLocation">{t('jobPostingForm.workLocation')}</Label>
              <Input
                id="workLocation"
                placeholder={t('jobPostingForm.workLocationPlaceholder')}
                {...register('workLocation')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('jobPostingForm.salaryInfo')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="salaryNegotiable"
              checked={isSalaryNegotiable}
              onCheckedChange={(checked) => setValue('salaryNegotiable', checked === true)}
            />
            <Label htmlFor="salaryNegotiable" className="cursor-pointer">
              {t('jobPostingForm.salaryNegotiable')}
            </Label>
          </div>

          {!isSalaryNegotiable && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="salaryMin">{t('jobPostingForm.salaryMin')}</Label>
                <Input
                  id="salaryMin"
                  type="number"
                  placeholder="3000"
                  {...register('salaryMin')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salaryMax">{t('jobPostingForm.salaryMax')}</Label>
                <Input
                  id="salaryMax"
                  type="number"
                  placeholder="5000"
                  {...register('salaryMax')}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('jobPostingForm.postingPeriod')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="openDate">{t('jobPostingForm.startDate')}</Label>
              <Input
                id="openDate"
                type="date"
                {...register('openDate', { required: t('jobPostingForm.validation.startDateRequired') })}
              />
              {errors.openDate && (
                <p className="text-sm text-destructive">{errors.openDate.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="closeDate">{t('jobPostingForm.endDate')}</Label>
              <Input
                id="closeDate"
                type="date"
                {...register('closeDate', { required: t('jobPostingForm.validation.endDateRequired') })}
              />
              {errors.closeDate && (
                <p className="text-sm text-destructive">{errors.closeDate.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('jobPostingForm.detailContent')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="jobDescription">{t('jobPostingForm.jobDescription')}</Label>
            <Textarea
              id="jobDescription"
              placeholder={t('jobPostingForm.jobDescriptionPlaceholder')}
              rows={6}
              {...register('jobDescription', { required: t('jobPostingForm.validation.jobDescriptionRequired') })}
            />
            {errors.jobDescription && (
              <p className="text-sm text-destructive">{errors.jobDescription.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="requirements">{t('jobPostingForm.requirements')}</Label>
            <Textarea
              id="requirements"
              placeholder={t('jobPostingForm.requirementsPlaceholder')}
              rows={4}
              {...register('requirements')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="preferredQualifications">{t('jobPostingForm.preferredQualifications')}</Label>
            <Textarea
              id="preferredQualifications"
              placeholder={t('jobPostingForm.preferredQualificationsPlaceholder')}
              rows={4}
              {...register('preferredQualifications')}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t('common.saving') : isEditMode ? t('common.edit') : t('common.register')}
        </Button>
      </div>
    </form>
  );
}
