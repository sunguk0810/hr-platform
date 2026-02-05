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
import { Users2, Save, Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useCreateCommittee } from '../hooks/useCommittee';
import type { CommitteeType } from '@hr-platform/shared-types';
import { COMMITTEE_TYPE_LABELS } from '@hr-platform/shared-types';

const committeeSchema = z.object({
  code: z.string().min(1, '위원회 코드를 입력해주세요').max(20),
  name: z.string().min(1, '위원회명을 입력해주세요').max(100),
  type: z.enum(['PERMANENT', 'TEMPORARY', 'PROJECT'] as const, {
    required_error: '위원회 유형을 선택해주세요',
  }),
  purpose: z.string().min(1, '설립 목적을 입력해주세요').max(500),
  startDate: z.string().min(1, '시작일을 입력해주세요'),
  endDate: z.string().optional(),
  meetingSchedule: z.string().max(200).optional(),
});

type CommitteeFormData = z.infer<typeof committeeSchema>;

export default function CommitteeCreatePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();

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
        title: '등록 완료',
        description: '위원회가 성공적으로 등록되었습니다.',
      });

      navigate('/committee');
    } catch {
      toast({
        title: '등록 실패',
        description: '위원회 등록 중 오류가 발생했습니다.',
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
            <h1 className="text-xl font-bold">위원회 등록</h1>
            <p className="text-sm text-muted-foreground">새로운 위원회 생성</p>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          {/* 기본 정보 섹션 */}
          <div className="bg-card rounded-xl border p-4 space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Users2 className="h-4 w-4" />
              기본 정보
            </h3>

            <div className="space-y-2">
              <Label htmlFor="mobile-code">위원회 코드 *</Label>
              <Input
                id="mobile-code"
                {...register('code')}
                placeholder="예: SAFETY_COMM"
              />
              {errors.code && (
                <p className="text-sm text-destructive">{errors.code.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile-type">유형 *</Label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="mobile-type">
                      <SelectValue placeholder="유형 선택" />
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
              <Label htmlFor="mobile-name">위원회명 *</Label>
              <Input
                id="mobile-name"
                {...register('name')}
                placeholder="위원회명을 입력하세요"
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile-purpose">설립 목적 *</Label>
              <Textarea
                id="mobile-purpose"
                {...register('purpose')}
                placeholder="위원회 설립 목적을 입력하세요"
                rows={3}
              />
              {errors.purpose && (
                <p className="text-sm text-destructive">{errors.purpose.message}</p>
              )}
            </div>
          </div>

          {/* 활동 기간 섹션 */}
          <div className="bg-card rounded-xl border p-4 space-y-4">
            <h3 className="text-sm font-medium">활동 기간</h3>

            <div className="space-y-2">
              <Label htmlFor="mobile-startDate">시작일 *</Label>
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
                <Label htmlFor="mobile-endDate">종료 예정일</Label>
                <Input
                  id="mobile-endDate"
                  type="date"
                  {...register('endDate')}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="mobile-meetingSchedule">정기 회의 일정</Label>
              <Input
                id="mobile-meetingSchedule"
                {...register('meetingSchedule')}
                placeholder="예: 매월 첫째 주 월요일 10:00"
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
              취소
            </Button>
            <Button type="submit" disabled={isPending} className="flex-1">
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              등록
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
        title="위원회 등록"
        description="새로운 위원회를 등록합니다."
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users2 className="h-5 w-5" aria-hidden="true" />
                기본 정보
              </CardTitle>
              <CardDescription>위원회의 기본 정보를 입력합니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="code">위원회 코드 *</Label>
                  <Input
                    id="code"
                    {...register('code')}
                    placeholder="예: SAFETY_COMM"
                  />
                  {errors.code && (
                    <p className="text-sm text-destructive">{errors.code.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">유형 *</Label>
                  <Controller
                    name="type"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="type">
                          <SelectValue placeholder="유형 선택" />
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
                <Label htmlFor="name">위원회명 *</Label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="위원회명을 입력하세요"
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="purpose">설립 목적 *</Label>
                <Textarea
                  id="purpose"
                  {...register('purpose')}
                  placeholder="위원회 설립 목적을 입력하세요"
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
              <CardTitle>활동 기간</CardTitle>
              <CardDescription>위원회의 활동 기간과 회의 일정을 설정합니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startDate">시작일 *</Label>
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
                    <Label htmlFor="endDate">종료 예정일</Label>
                    <Input
                      id="endDate"
                      type="date"
                      {...register('endDate')}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="meetingSchedule">정기 회의 일정</Label>
                <Input
                  id="meetingSchedule"
                  {...register('meetingSchedule')}
                  placeholder="예: 매월 첫째 주 월요일 10:00"
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
            취소
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Save className="mr-2 h-4 w-4" aria-hidden="true" />
            )}
            등록
          </Button>
        </div>
      </form>
    </>
  );
}
