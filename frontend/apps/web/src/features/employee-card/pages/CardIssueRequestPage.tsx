import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CreditCard, Save, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useCreateCardIssueRequest } from '../hooks/useEmployeeCard';
import type { CardIssueType } from '@hr-platform/shared-types';
import { CARD_ISSUE_TYPE_LABELS } from '@hr-platform/shared-types';

const cardIssueSchema = z.object({
  issueType: z.enum(['NEW', 'REISSUE', 'RENEWAL'] as const, {
    required_error: '발급 유형을 선택해주세요',
  }),
  reason: z.string().min(1, '사유를 입력해주세요').max(500),
});

type CardIssueFormData = z.infer<typeof cardIssueSchema>;

export default function CardIssueRequestPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const createMutation = useCreateCardIssueRequest();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CardIssueFormData>({
    resolver: zodResolver(cardIssueSchema),
    defaultValues: {
      issueType: 'NEW',
      reason: '',
    },
  });

  const onSubmit = async (data: CardIssueFormData) => {
    try {
      await createMutation.mutateAsync({
        employeeId: '',
        issueType: data.issueType,
        reason: data.reason,
      });

      toast({
        title: '신청 완료',
        description: '사원증 발급 신청이 등록되었습니다.',
      });

      navigate('/employee-card');
    } catch {
      toast({
        title: '신청 실패',
        description: '사원증 발급 신청 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  const isPending = createMutation.isPending;

  return (
    <>
      <PageHeader
        title="사원증 발급 신청"
        description="사원증 발급을 신청합니다."
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" aria-hidden="true" />
              발급 정보
            </CardTitle>
            <CardDescription>발급 유형과 사유를 입력합니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="issueType">발급 유형 *</Label>
              <Controller
                name="issueType"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="issueType">
                      <SelectValue placeholder="유형 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.entries(CARD_ISSUE_TYPE_LABELS) as [CardIssueType, string][]).map(
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
              {errors.issueType && (
                <p className="text-sm text-destructive">{errors.issueType.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">사유 *</Label>
              <Textarea
                id="reason"
                {...register('reason')}
                placeholder="발급 사유를 입력하세요"
                rows={6}
              />
              {errors.reason && (
                <p className="text-sm text-destructive">{errors.reason.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/employee-card')}
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
