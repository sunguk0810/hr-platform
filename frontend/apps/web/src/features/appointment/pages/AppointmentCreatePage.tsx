import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
import type { TFunction } from 'i18next';

function createDraftSchema(t: TFunction) {
  return z.object({
    title: z.string().min(1, t('createValidation.subjectRequired')),
    effectiveDate: z.date({ required_error: t('createValidation.effectiveDateRequired') }),
    description: z.string().optional(),
  });
}

type CreateDraftFormData = z.infer<ReturnType<typeof createDraftSchema>>;

export default function AppointmentCreatePage() {
  const navigate = useNavigate();
  const { t } = useTranslation('appointment');
  const { toast } = useToast();
  const [isDetailFormOpen, setIsDetailFormOpen] = useState(false);
  const [details, setDetails] = useState<AppointmentDetail[]>([]);

  const createDraftMutation = useCreateDraft();
  const addDetailMutation = useAddDetail();
  const removeDetailMutation = useRemoveDetail();
  const submitDraftMutation = useSubmitDraft();

  const schema = React.useMemo(() => createDraftSchema(t), [t]);

  const form = useForm<CreateDraftFormData>({
    resolver: zodResolver(schema),
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
    toPositionCode?: string;
    toGradeCode?: string;
    toJobCode?: string;
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
      toPositionCode: data.toPositionCode,
      toPositionName: data.toPositionCode ? '대상 직책' : undefined,
      toGradeCode: data.toGradeCode,
      toGradeName: data.toGradeCode ? '대상 직급' : undefined,
      toJobCode: data.toJobCode,
      toJobName: data.toJobCode ? '대상 직무' : undefined,
      reason: data.reason,
      status: 'PENDING',
    };
    setDetails((prev) => [...prev, newDetail]);
    toast({
      title: t('createToast.addTarget'),
      description: t('createToast.addTargetDesc', { name: emp.name }),
    });
  };

  const handleRemoveDetail = (detailId: string) => {
    setDetails((prev) => prev.filter((d) => d.id !== detailId));
    toast({
      title: t('createToast.removeTarget'),
      description: t('createToast.removeTargetDesc'),
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
          toPositionCode: d.toPositionCode,
          toGradeCode: d.toGradeCode,
          toJobCode: d.toJobCode,
          reason: d.reason,
        })),
      });
      toast({
        title: t('createToast.draftSuccess'),
        description: t('createToast.draftSuccessDesc'),
      });
      navigate(`/appointments/${response.data.id}`);
    } catch {
      toast({
        title: t('createToast.draftFailed'),
        description: t('createToast.draftFailedDesc'),
        variant: 'destructive',
      });
    }
  };

  const handleSubmitForApproval = async () => {
    const isValid = await form.trigger();
    if (!isValid) return;

    if (details.length === 0) {
      toast({
        title: t('createToast.noTarget'),
        description: t('createToast.noTargetDesc'),
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
          toPositionCode: d.toPositionCode,
          toGradeCode: d.toGradeCode,
          toJobCode: d.toJobCode,
          reason: d.reason,
        })),
      });

      // Then submit for approval
      await submitDraftMutation.mutateAsync(createResponse.data.id);

      toast({
        title: t('createToast.submitSuccess'),
        description: t('createToast.submitSuccessDesc'),
      });
      navigate(`/appointments/${createResponse.data.id}`);
    } catch {
      toast({
        title: t('createToast.submitFailed'),
        description: t('createToast.submitFailedDesc'),
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
        title={t('create.title')}
        description={t('create.description')}
        actions={
          <Button variant="outline" onClick={() => navigate('/appointments')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('goToList')}
          </Button>
        }
      />

      <div className="grid gap-6">
        {/* Basic Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>{t('create.basicInfo')}</CardTitle>
            <CardDescription>{t('create.basicInfoDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">{t('create.subjectLabel')}</Label>
                  <Input
                    id="title"
                    placeholder={t('create.subjectPlaceholder')}
                    {...form.register('title')}
                  />
                  {form.formState.errors.title && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.title.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>{t('create.effectiveDateLabel')}</Label>
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
                          <span>{t('create.effectiveDateSelect')}</span>
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
                <Label htmlFor="description">{t('create.descriptionLabel')}</Label>
                <Textarea
                  id="description"
                  placeholder={t('create.descriptionPlaceholder')}
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
                <CardTitle>{t('create.targetSection')}</CardTitle>
                <CardDescription>
                  {t('create.targetSectionDesc', { count: details.length })}
                </CardDescription>
              </div>
              <Button onClick={() => setIsDetailFormOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                {t('create.addEmployee')}
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
            {t('buttons.cancel')}
          </Button>
          <Button variant="outline" onClick={handleSaveDraft} disabled={isLoading}>
            <Save className="mr-2 h-4 w-4" />
            {t('buttons.saveDraft')}
          </Button>
          <Button onClick={handleSubmitForApproval} disabled={isLoading}>
            <Send className="mr-2 h-4 w-4" />
            {t('buttons.requestApproval')}
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
