import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { approvalService } from '../services/approvalService';
import { TemplateLineBuilder } from '../components/TemplateLineBuilder';
import { useToast } from '@/hooks/useToast';
import type { ApprovalLineTemplate } from '@hr-platform/shared-types';

const CATEGORIES = [
  { value: 'LEAVE_REQUEST', label: '휴가' },
  { value: 'EXPENSE', label: '경비' },
  { value: 'OVERTIME', label: '초과근무' },
  { value: 'PERSONNEL', label: '인사' },
  { value: 'GENERAL', label: '일반' },
];

const formSchema = z.object({
  code: z.string().min(1, '양식코드는 필수입니다').max(50, '최대 50자까지 입력 가능합니다'),
  name: z.string().min(1, '양식명은 필수입니다').max(100, '최대 100자까지 입력 가능합니다'),
  description: z.string().max(500, '최대 500자까지 입력 가능합니다').optional(),
  category: z.string().min(1, '문서유형을 선택해주세요'),
  retentionPeriod: z.number().min(1).max(3650).optional(),
  isActive: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

export default function ApprovalTemplateEditPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const duplicateId = searchParams.get('duplicate');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isNew = !id;

  const [approvalLine, setApprovalLine] = useState<ApprovalLineTemplate[]>([]);

  const { data: templateData, isLoading: isLoadingTemplate } = useQuery({
    queryKey: ['approval-template', id || duplicateId],
    queryFn: () => approvalService.getTemplate((id || duplicateId)!),
    enabled: !!(id || duplicateId),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: '',
      name: '',
      description: '',
      category: '',
      retentionPeriod: 365,
      isActive: true,
    },
  });

  useEffect(() => {
    if (templateData?.data) {
      const template = templateData.data;
      reset({
        code: duplicateId ? `${template.code}_COPY` : template.code,
        name: duplicateId ? `${template.name} (복사본)` : template.name,
        description: template.description || '',
        category: template.category,
        retentionPeriod: template.retentionPeriod || 365,
        isActive: duplicateId ? true : template.isActive,
      });
      setApprovalLine(template.defaultApprovalLine || []);
    }
  }, [templateData, duplicateId, reset]);

  const createMutation = useMutation({
    mutationFn: (data: FormData & { defaultApprovalLine: ApprovalLineTemplate[] }) =>
      approvalService.createTemplate(data),
    onSuccess: () => {
      toast({ title: '등록 완료', description: '양식이 등록되었습니다.' });
      queryClient.invalidateQueries({ queryKey: ['approval-templates'] });
      navigate('/settings/approval-templates');
    },
    onError: () => {
      toast({ title: '등록 실패', description: '양식 등록 중 오류가 발생했습니다.', variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: FormData & { defaultApprovalLine: ApprovalLineTemplate[] }) =>
      approvalService.updateTemplate(id!, data),
    onSuccess: () => {
      toast({ title: '수정 완료', description: '양식이 수정되었습니다.' });
      queryClient.invalidateQueries({ queryKey: ['approval-templates'] });
      queryClient.invalidateQueries({ queryKey: ['approval-template', id] });
      navigate('/settings/approval-templates');
    },
    onError: () => {
      toast({ title: '수정 실패', description: '양식 수정 중 오류가 발생했습니다.', variant: 'destructive' });
    },
  });

  const onSubmit = (data: FormData) => {
    const payload = {
      ...data,
      defaultApprovalLine: approvalLine,
    };

    if (isNew || duplicateId) {
      createMutation.mutate(payload);
    } else {
      updateMutation.mutate(payload);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const isActive = watch('isActive');

  if ((id || duplicateId) && isLoadingTemplate) {
    return (
      <>
        <PageHeader
          title={isNew ? '양식 등록' : '양식 수정'}
          description="로딩 중..."
        />
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={isNew || duplicateId ? '양식 등록' : '양식 수정'}
        description={isNew || duplicateId ? '새로운 결재 양식을 등록합니다.' : '결재 양식을 수정합니다.'}
        actions={
          <Button variant="outline" onClick={() => navigate('/settings/approval-templates')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            목록으로
          </Button>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">
                  양식코드 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="code"
                  placeholder="예: LEAVE_ANNUAL"
                  {...register('code')}
                  disabled={!!id}
                />
                {errors.code && (
                  <p className="text-sm text-destructive">{errors.code.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">
                  문서유형 <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={watch('category')}
                  onValueChange={(value) => setValue('category', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="문서유형 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="text-sm text-destructive">{errors.category.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">
                양식명 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="예: 연차 휴가 신청서"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">설명</Label>
              <Textarea
                id="description"
                placeholder="양식에 대한 설명을 입력하세요..."
                rows={3}
                {...register('description')}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="retentionPeriod">보존 기간 (일)</Label>
                <Input
                  id="retentionPeriod"
                  type="number"
                  min={1}
                  max={3650}
                  {...register('retentionPeriod', { valueAsNumber: true })}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>활성 상태</Label>
                  <p className="text-sm text-muted-foreground">
                    비활성화된 양식은 결재 작성 시 선택할 수 없습니다.
                  </p>
                </div>
                <Switch
                  checked={isActive}
                  onCheckedChange={(checked) => setValue('isActive', checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>기본 결재선</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              이 양식을 사용하여 결재를 작성할 때 자동으로 설정되는 기본 결재선입니다.
              사용자가 결재 작성 시 수정할 수 있습니다.
            </p>
            <TemplateLineBuilder
              value={approvalLine}
              onChange={setApprovalLine}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/settings/approval-templates')}
          >
            취소
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            {isNew || duplicateId ? '등록' : '저장'}
          </Button>
        </div>
      </form>
    </>
  );
}
