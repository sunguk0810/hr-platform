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
import { Heart, Save, Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useCreateCondolenceRequest, useCondolencePolicies } from '../hooks/useCondolence';
import type { CondolenceType } from '@hr-platform/shared-types';
import { CONDOLENCE_TYPE_LABELS } from '@hr-platform/shared-types';

const condolenceSchema = z.object({
  type: z.enum([
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
    required_error: '경조 유형을 선택해주세요',
  }),
  targetName: z.string().min(1, '대상자명을 입력해주세요').max(50),
  relationship: z.string().min(1, '관계를 입력해주세요').max(50),
  eventDate: z.string().min(1, '발생일을 입력해주세요'),
  description: z.string().min(1, '상세 내용을 입력해주세요').max(500),
});

type CondolenceFormData = z.infer<typeof condolenceSchema>;

export default function CondolenceCreatePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();

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
      type: 'MARRIAGE',
      targetName: '',
      relationship: '',
      eventDate: '',
      description: '',
    },
  });

  const selectedType = watch('type');
  const selectedPolicy = policies.find((p) => p.type === selectedType);

  const onSubmit = async (data: CondolenceFormData) => {
    try {
      await createMutation.mutateAsync({
        type: data.type,
        targetName: data.targetName,
        relationship: data.relationship,
        eventDate: data.eventDate,
        description: data.description,
      });

      toast({
        title: '신청 완료',
        description: '경조비 신청이 등록되었습니다.',
      });

      navigate('/condolence');
    } catch {
      toast({
        title: '신청 실패',
        description: '경조비 신청 중 오류가 발생했습니다.',
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
            <h1 className="text-xl font-bold">경조비 신청</h1>
            <p className="text-sm text-muted-foreground">경조비를 신청합니다</p>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          {/* 경조 정보 섹션 */}
          <div className="bg-card rounded-xl border p-4 space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Heart className="h-4 w-4" />
              경조 정보
            </h3>

            <div className="space-y-2">
              <Label htmlFor="mobile-type">경조 유형 *</Label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="mobile-type">
                      <SelectValue placeholder="유형 선택" />
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
              {errors.type && (
                <p className="text-sm text-destructive">{errors.type.message}</p>
              )}
            </div>

            {/* Policy Info Card */}
            {selectedPolicy && (
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                <p className="text-sm font-medium text-primary mb-2">지급 정책</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-background/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">지급 금액</p>
                    <p className="text-lg font-bold text-primary">
                      {selectedPolicy.amount.toLocaleString()}원
                    </p>
                  </div>
                  <div className="bg-background/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">경조휴가</p>
                    <p className="text-lg font-bold text-primary">
                      {selectedPolicy.leavedays}일
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="mobile-eventDate">발생일 *</Label>
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

          {/* 대상자 정보 섹션 */}
          <div className="bg-card rounded-xl border p-4 space-y-4">
            <h3 className="text-sm font-medium">대상자 정보</h3>

            <div className="space-y-2">
              <Label htmlFor="mobile-targetName">대상자명 *</Label>
              <Input
                id="mobile-targetName"
                {...register('targetName')}
                placeholder="대상자 이름을 입력하세요"
              />
              {errors.targetName && (
                <p className="text-sm text-destructive">{errors.targetName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile-relationship">관계 *</Label>
              <Input
                id="mobile-relationship"
                {...register('relationship')}
                placeholder="예: 본인, 부, 모, 배우자 등"
              />
              {errors.relationship && (
                <p className="text-sm text-destructive">{errors.relationship.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile-description">상세 내용 *</Label>
              <Textarea
                id="mobile-description"
                {...register('description')}
                placeholder="경조 관련 상세 내용을 입력하세요"
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
              취소
            </Button>
            <Button type="submit" disabled={isPending} className="flex-1">
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              신청
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
        title="경조비 신청"
        description="경조비를 신청합니다."
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" aria-hidden="true" />
                경조 정보
              </CardTitle>
              <CardDescription>경조 유형과 발생 정보를 입력합니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type">경조 유형 *</Label>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="type">
                        <SelectValue placeholder="유형 선택" />
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
                {errors.type && (
                  <p className="text-sm text-destructive">{errors.type.message}</p>
                )}
              </div>

              {selectedPolicy && (
                <div className="p-3 rounded-md bg-muted">
                  <p className="text-sm font-medium">지급 정책</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    지급 금액: {selectedPolicy.amount.toLocaleString()}원
                  </p>
                  <p className="text-sm text-muted-foreground">
                    경조휴가: {selectedPolicy.leavedays}일
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="eventDate">발생일 *</Label>
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
              <CardTitle>대상자 정보</CardTitle>
              <CardDescription>경조 대상자 정보를 입력합니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="targetName">대상자명 *</Label>
                <Input
                  id="targetName"
                  {...register('targetName')}
                  placeholder="대상자 이름을 입력하세요"
                />
                {errors.targetName && (
                  <p className="text-sm text-destructive">{errors.targetName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="relationship">관계 *</Label>
                <Input
                  id="relationship"
                  {...register('relationship')}
                  placeholder="예: 본인, 부, 모, 배우자 등"
                />
                {errors.relationship && (
                  <p className="text-sm text-destructive">{errors.relationship.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">상세 내용 *</Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  placeholder="경조 관련 상세 내용을 입력하세요"
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
            취소
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Save className="mr-2 h-4 w-4" aria-hidden="true" />
            )}
            신청
          </Button>
        </div>
      </form>
    </>
  );
}
