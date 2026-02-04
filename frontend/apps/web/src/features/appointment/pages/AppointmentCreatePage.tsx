import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ArrowLeft, Plus, Save, Send, CalendarIcon } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';
import { AppointmentDetailForm, AppointmentDetailTable } from '../components';
import { useCreateDraft, useAddDetail, useRemoveDetail, useSubmitDraft } from '../hooks/useAppointments';
import type { AppointmentDetail, AppointmentType } from '@hr-platform/shared-types';

const createDraftSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요'),
  effectiveDate: z.date({ required_error: '시행일을 선택해주세요' }),
  description: z.string().optional(),
});

type CreateDraftFormData = z.infer<typeof createDraftSchema>;

export default function AppointmentCreatePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isDetailFormOpen, setIsDetailFormOpen] = useState(false);
  const [details, setDetails] = useState<AppointmentDetail[]>([]);

  const createDraftMutation = useCreateDraft();
  const addDetailMutation = useAddDetail();
  const removeDetailMutation = useRemoveDetail();
  const submitDraftMutation = useSubmitDraft();

  const form = useForm<CreateDraftFormData>({
    resolver: zodResolver(createDraftSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  });

  // Mock employee data for adding details before draft creation
  const mockEmployeeData: Record<string, { name: string; number: string }> = {
    'emp-002': { name: '김철수', number: 'EMP-2024-002' },
    'emp-003': { name: '이영희', number: 'EMP-2024-003' },
    'emp-004': { name: '박민수', number: 'EMP-2024-004' },
    'emp-005': { name: '최수진', number: 'EMP-2024-005' },
    'emp-006': { name: '정대현', number: 'EMP-2024-006' },
    'emp-007': { name: '강민지', number: 'EMP-2024-007' },
  };

  interface DetailFormData {
    employeeId: string;
    appointmentType: string;
    toDepartmentId?: string;
    toPositionId?: string;
    toGradeId?: string;
    toJobId?: string;
    reason?: string;
  }

  const handleAddDetail = (data: DetailFormData) => {
    const emp = mockEmployeeData[data.employeeId] || { name: '알 수 없음', number: data.employeeId };
    const newDetail: AppointmentDetail = {
      id: `temp-${Date.now()}`,
      employeeId: data.employeeId,
      employeeName: emp.name,
      employeeNumber: emp.number,
      appointmentType: data.appointmentType as AppointmentType,
      toDepartmentId: data.toDepartmentId,
      toDepartmentName: data.toDepartmentId ? '대상 부서' : undefined,
      toPositionId: data.toPositionId,
      toPositionName: data.toPositionId ? '대상 직책' : undefined,
      toGradeId: data.toGradeId,
      toGradeName: data.toGradeId ? '대상 직급' : undefined,
      toJobId: data.toJobId,
      toJobName: data.toJobId ? '대상 직무' : undefined,
      reason: data.reason,
      status: 'PENDING',
    };
    setDetails((prev) => [...prev, newDetail]);
    toast({
      title: '대상 추가',
      description: `${emp.name} 직원이 발령 대상에 추가되었습니다.`,
    });
  };

  const handleRemoveDetail = (detailId: string) => {
    setDetails((prev) => prev.filter((d) => d.id !== detailId));
    toast({
      title: '대상 삭제',
      description: '발령 대상이 삭제되었습니다.',
    });
  };

  const handleSaveDraft = async () => {
    const isValid = await form.trigger();
    if (!isValid) return;

    const values = form.getValues();
    try {
      const response = await createDraftMutation.mutateAsync({
        title: values.title,
        effectiveDate: format(values.effectiveDate, 'yyyy-MM-dd'),
        description: values.description,
        details: details.map((d) => ({
          employeeId: d.employeeId,
          appointmentType: d.appointmentType,
          toDepartmentId: d.toDepartmentId,
          toPositionId: d.toPositionId,
          toGradeId: d.toGradeId,
          toJobId: d.toJobId,
          reason: d.reason,
        })),
      });
      toast({
        title: '임시저장 완료',
        description: '발령안이 임시저장되었습니다.',
      });
      navigate(`/appointments/${response.data.id}`);
    } catch {
      toast({
        title: '저장 실패',
        description: '발령안 저장 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleSubmitForApproval = async () => {
    const isValid = await form.trigger();
    if (!isValid) return;

    if (details.length === 0) {
      toast({
        title: '결재 요청 불가',
        description: '발령 대상이 없습니다. 최소 1명 이상의 대상을 추가해주세요.',
        variant: 'destructive',
      });
      return;
    }

    const values = form.getValues();
    try {
      // First create the draft
      const createResponse = await createDraftMutation.mutateAsync({
        title: values.title,
        effectiveDate: format(values.effectiveDate, 'yyyy-MM-dd'),
        description: values.description,
        details: details.map((d) => ({
          employeeId: d.employeeId,
          appointmentType: d.appointmentType,
          toDepartmentId: d.toDepartmentId,
          toPositionId: d.toPositionId,
          toGradeId: d.toGradeId,
          toJobId: d.toJobId,
          reason: d.reason,
        })),
      });

      // Then submit for approval
      await submitDraftMutation.mutateAsync(createResponse.data.id);

      toast({
        title: '결재 요청 완료',
        description: '발령안이 결재 요청되었습니다.',
      });
      navigate(`/appointments/${createResponse.data.id}`);
    } catch {
      toast({
        title: '결재 요청 실패',
        description: '결재 요청 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  const isLoading =
    createDraftMutation.isPending ||
    addDetailMutation.isPending ||
    removeDetailMutation.isPending ||
    submitDraftMutation.isPending;

  return (
    <>
      <PageHeader
        title="발령안 작성"
        description="새로운 인사발령안을 작성합니다."
        actions={
          <Button variant="outline" onClick={() => navigate('/appointments')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            목록으로
          </Button>
        }
      />

      <div className="grid gap-6">
        {/* Basic Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
            <CardDescription>발령안의 기본 정보를 입력합니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">제목 *</Label>
                  <Input
                    id="title"
                    placeholder="예: 2026년 1분기 정기 인사발령"
                    {...form.register('title')}
                  />
                  {form.formState.errors.title && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.title.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>시행일 *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !form.watch('effectiveDate') && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {form.watch('effectiveDate') ? (
                          format(form.watch('effectiveDate'), 'PPP', { locale: ko })
                        ) : (
                          <span>시행일 선택</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={form.watch('effectiveDate')}
                        onSelect={(date) => form.setValue('effectiveDate', date as Date)}
                      />
                    </PopoverContent>
                  </Popover>
                  {form.formState.errors.effectiveDate && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.effectiveDate.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">설명</Label>
                <Textarea
                  id="description"
                  placeholder="발령에 대한 설명을 입력하세요"
                  rows={3}
                  {...form.register('description')}
                />
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Details Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>발령 대상</CardTitle>
                <CardDescription>
                  발령 대상 직원을 추가합니다. ({details.length}명)
                </CardDescription>
              </div>
              <Button onClick={() => setIsDetailFormOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                직원 추가
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <AppointmentDetailTable
              details={details}
              onRemove={handleRemoveDetail}
              isEditable
              isLoading={isLoading}
            />
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => navigate('/appointments')}>
            취소
          </Button>
          <Button variant="outline" onClick={handleSaveDraft} disabled={isLoading}>
            <Save className="mr-2 h-4 w-4" />
            임시저장
          </Button>
          <Button onClick={handleSubmitForApproval} disabled={isLoading}>
            <Send className="mr-2 h-4 w-4" />
            결재요청
          </Button>
        </div>
      </div>

      {/* Add Detail Dialog */}
      <AppointmentDetailForm
        open={isDetailFormOpen}
        onOpenChange={setIsDetailFormOpen}
        onSubmit={handleAddDetail}
        isLoading={isLoading}
      />
    </>
  );
}
