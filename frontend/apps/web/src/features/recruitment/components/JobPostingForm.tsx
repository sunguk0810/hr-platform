import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { format, addMonths } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import type {
  JobPosting,
  CreateJobPostingRequest,
  UpdateJobPostingRequest,
  RecruitmentEmploymentType,
} from '@hr-platform/shared-types';

const EMPLOYMENT_TYPES: { value: RecruitmentEmploymentType; label: string }[] = [
  { value: 'FULL_TIME', label: '정규직' },
  { value: 'CONTRACT', label: '계약직' },
  { value: 'INTERN', label: '인턴' },
  { value: 'PART_TIME', label: '파트타임' },
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
  isSalaryNegotiable: boolean;
  headcount: string;
  workLocation: string;
  postingStartDate: string;
  postingEndDate: string;
}

export function JobPostingForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: JobPostingFormProps) {
  const isEditMode = !!initialData;

  const {
    register,
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
      isSalaryNegotiable: false,
      headcount: '1',
      workLocation: '',
      postingStartDate: format(new Date(), 'yyyy-MM-dd'),
      postingEndDate: format(addMonths(new Date(), 1), 'yyyy-MM-dd'),
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
      setValue('isSalaryNegotiable', initialData.isSalaryNegotiable || false);
      setValue('headcount', initialData.headcount.toString());
      setValue('workLocation', initialData.workLocation || '');
      setValue('postingStartDate', initialData.postingStartDate.split('T')[0]);
      setValue('postingEndDate', initialData.postingEndDate.split('T')[0]);
    }
  }, [initialData, setValue]);

  const isSalaryNegotiable = watch('isSalaryNegotiable');

  const validateSalaryRange = (salaryMin: string, salaryMax: string): string | null => {
    if (!salaryMin || !salaryMax) return null;
    const min = parseInt(salaryMin);
    const max = parseInt(salaryMax);
    if (min > max) {
      return '최소 연봉이 최대 연봉보다 클 수 없습니다.';
    }
    return null;
  };

  const validateDateRange = (startDate: string, endDate: string): string | null => {
    if (!startDate || !endDate) return null;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) {
      return '시작일이 종료일보다 늦을 수 없습니다.';
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (end < today) {
      return '종료일은 오늘 이후여야 합니다.';
    }
    return null;
  };

  const handleFormSubmit = (data: FormData) => {
    // 급여 범위 검증
    if (!data.isSalaryNegotiable) {
      const salaryError = validateSalaryRange(data.salaryMin, data.salaryMax);
      if (salaryError) {
        alert(salaryError);
        return;
      }
    }

    // 날짜 범위 검증
    const dateError = validateDateRange(data.postingStartDate, data.postingEndDate);
    if (dateError) {
      alert(dateError);
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
      isSalaryNegotiable: data.isSalaryNegotiable,
      headcount: parseInt(data.headcount),
      workLocation: data.workLocation || undefined,
      postingStartDate: data.postingStartDate,
      postingEndDate: data.postingEndDate,
    };
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="title">공고 제목 *</Label>
              <Input
                id="title"
                placeholder="예: 백엔드 개발자"
                {...register('title', { required: '공고 제목을 입력해주세요.' })}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="departmentId">채용 부서 *</Label>
              <select
                id="departmentId"
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...register('departmentId', { required: '부서를 선택해주세요.' })}
              >
                <option value="">선택</option>
                <option value="dept-001">개발팀</option>
                <option value="dept-002">인사팀</option>
                <option value="dept-003">재무팀</option>
                <option value="dept-004">마케팅팀</option>
                <option value="dept-005">디자인팀</option>
                <option value="dept-006">영업팀</option>
              </select>
              {errors.departmentId && (
                <p className="text-sm text-destructive">{errors.departmentId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="positionId">직책</Label>
              <select
                id="positionId"
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...register('positionId')}
              >
                <option value="">선택 (선택사항)</option>
                <option value="pos-001">팀장</option>
                <option value="pos-002">선임</option>
                <option value="pos-003">매니저</option>
                <option value="pos-004">주임</option>
                <option value="pos-005">책임</option>
                <option value="pos-006">사원</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="employmentType">고용 형태 *</Label>
              <select
                id="employmentType"
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...register('employmentType', { required: true })}
              >
                {EMPLOYMENT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="headcount">모집 인원 *</Label>
              <Input
                id="headcount"
                type="number"
                min="1"
                {...register('headcount', {
                  required: '모집 인원을 입력해주세요.',
                  min: { value: 1, message: '최소 1명 이상이어야 합니다.' },
                })}
              />
              {errors.headcount && (
                <p className="text-sm text-destructive">{errors.headcount.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="workLocation">근무지</Label>
              <Input
                id="workLocation"
                placeholder="예: 서울 강남구"
                {...register('workLocation')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>급여 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="isSalaryNegotiable"
              checked={isSalaryNegotiable}
              onCheckedChange={(checked) => setValue('isSalaryNegotiable', checked === true)}
            />
            <Label htmlFor="isSalaryNegotiable" className="cursor-pointer">
              급여 협의 가능
            </Label>
          </div>

          {!isSalaryNegotiable && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="salaryMin">최소 연봉 (만원)</Label>
                <Input
                  id="salaryMin"
                  type="number"
                  placeholder="3000"
                  {...register('salaryMin')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salaryMax">최대 연봉 (만원)</Label>
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
          <CardTitle>공고 기간</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="postingStartDate">시작일 *</Label>
              <Input
                id="postingStartDate"
                type="date"
                {...register('postingStartDate', { required: '시작일을 입력해주세요.' })}
              />
              {errors.postingStartDate && (
                <p className="text-sm text-destructive">{errors.postingStartDate.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="postingEndDate">종료일 *</Label>
              <Input
                id="postingEndDate"
                type="date"
                {...register('postingEndDate', { required: '종료일을 입력해주세요.' })}
              />
              {errors.postingEndDate && (
                <p className="text-sm text-destructive">{errors.postingEndDate.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>상세 내용</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="jobDescription">직무 설명 *</Label>
            <Textarea
              id="jobDescription"
              placeholder="담당 업무와 역할에 대해 상세히 작성해주세요."
              rows={6}
              {...register('jobDescription', { required: '직무 설명을 입력해주세요.' })}
            />
            {errors.jobDescription && (
              <p className="text-sm text-destructive">{errors.jobDescription.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="requirements">자격 요건</Label>
            <Textarea
              id="requirements"
              placeholder="필수 자격 요건을 작성해주세요."
              rows={4}
              {...register('requirements')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="preferredQualifications">우대 사항</Label>
            <Textarea
              id="preferredQualifications"
              placeholder="우대 사항을 작성해주세요."
              rows={4}
              {...register('preferredQualifications')}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          취소
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? '저장 중...' : isEditMode ? '수정' : '등록'}
        </Button>
      </div>
    </form>
  );
}
