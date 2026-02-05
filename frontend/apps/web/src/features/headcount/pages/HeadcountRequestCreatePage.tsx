import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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

const headcountRequestSchema = z.object({
  type: z.enum(['INCREASE', 'DECREASE', 'TRANSFER'] as const, {
    required_error: '요청 유형을 선택해주세요',
  }),
  departmentId: z.string().min(1, '부서를 선택해주세요'),
  gradeId: z.string().min(1, '직급을 선택해주세요'),
  requestedCount: z.coerce.number().min(0, '0 이상의 숫자를 입력해주세요'),
  reason: z.string().min(1, '요청 사유를 입력해주세요').max(500),
  effectiveDate: z.string().min(1, '적용 예정일을 입력해주세요'),
  remarks: z.string().max(1000).optional(),
});

type HeadcountRequestFormData = z.infer<typeof headcountRequestSchema>;

export default function HeadcountRequestCreatePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();

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
      requestedCount: 0,
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
        requestedCount: data.requestedCount,
        reason: data.reason,
        effectiveDate: data.effectiveDate,
        remarks: data.remarks || undefined,
      });

      toast({
        title: '요청 완료',
        description: '정현원 변경 요청이 등록되었습니다.',
      });

      navigate('/headcount/requests');
    } catch {
      toast({
        title: '요청 실패',
        description: '정현원 변경 요청 중 오류가 발생했습니다.',
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
            <h1 className="text-xl font-bold">정현원 변경 요청</h1>
            <p className="text-sm text-muted-foreground">증원, 감원, 전환 요청</p>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          {/* 요청 정보 섹션 */}
          <div className="bg-card rounded-xl border p-4 space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              요청 정보
            </h3>

            <div className="space-y-2">
              <Label htmlFor="mobile-type">요청 유형 *</Label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="mobile-type">
                      <SelectValue placeholder="유형 선택" />
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
              <Label htmlFor="mobile-departmentId">부서 *</Label>
              <Controller
                name="departmentId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="mobile-departmentId">
                      <SelectValue placeholder="부서 선택" />
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
              <Label htmlFor="mobile-gradeId">직급 *</Label>
              <Controller
                name="gradeId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="mobile-gradeId">
                      <SelectValue placeholder="직급 선택" />
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

          {/* 요청 상세 섹션 */}
          <div className="bg-card rounded-xl border p-4 space-y-4">
            <h3 className="text-sm font-medium">요청 상세</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mobile-requestedCount">요청 인원 *</Label>
                <Input
                  id="mobile-requestedCount"
                  type="number"
                  min="0"
                  {...register('requestedCount')}
                />
                {errors.requestedCount && (
                  <p className="text-sm text-destructive">{errors.requestedCount.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile-effectiveDate">적용 예정일 *</Label>
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
              <Label htmlFor="mobile-reason">요청 사유 *</Label>
              <Textarea
                id="mobile-reason"
                {...register('reason')}
                placeholder="정현원 변경 요청 사유를 입력하세요"
                rows={3}
              />
              {errors.reason && (
                <p className="text-sm text-destructive">{errors.reason.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile-remarks">비고</Label>
              <Textarea
                id="mobile-remarks"
                {...register('remarks')}
                placeholder="기타 참고사항을 입력하세요"
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
              취소
            </Button>
            <Button type="submit" disabled={isPending} className="flex-1">
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              요청
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
        title="정현원 변경 요청"
        description="증원, 감원, 전환 요청을 등록합니다."
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" aria-hidden="true" />
                요청 정보
              </CardTitle>
              <CardDescription>변경 요청의 기본 정보를 입력합니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type">요청 유형 *</Label>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="type">
                        <SelectValue placeholder="유형 선택" />
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
                <Label htmlFor="departmentId">부서 *</Label>
                <Controller
                  name="departmentId"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="departmentId">
                        <SelectValue placeholder="부서 선택" />
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
                <Label htmlFor="gradeId">직급 *</Label>
                <Controller
                  name="gradeId"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="gradeId">
                        <SelectValue placeholder="직급 선택" />
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
              <CardTitle>요청 상세</CardTitle>
              <CardDescription>변경 내용과 사유를 입력합니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="requestedCount">요청 인원 *</Label>
                  <Input
                    id="requestedCount"
                    type="number"
                    min="0"
                    {...register('requestedCount')}
                  />
                  {errors.requestedCount && (
                    <p className="text-sm text-destructive">{errors.requestedCount.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="effectiveDate">적용 예정일 *</Label>
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
                <Label htmlFor="reason">요청 사유 *</Label>
                <Textarea
                  id="reason"
                  {...register('reason')}
                  placeholder="정현원 변경 요청 사유를 입력하세요"
                  rows={3}
                />
                {errors.reason && (
                  <p className="text-sm text-destructive">{errors.reason.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="remarks">비고</Label>
                <Textarea
                  id="remarks"
                  {...register('remarks')}
                  placeholder="기타 참고사항을 입력하세요"
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
            취소
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Save className="mr-2 h-4 w-4" aria-hidden="true" />
            )}
            요청
          </Button>
        </div>
      </form>
    </>
  );
}
