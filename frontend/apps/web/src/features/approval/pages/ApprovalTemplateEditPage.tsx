import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
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
import { ConditionalRoutingRules } from '../components/ConditionalRoutingRules';
import { useToast } from '@/hooks/useToast';
import type { ApprovalLineTemplate, ConditionalRoutingRule } from '@hr-platform/shared-types';

const createFormSchema = (t: TFunction) =>
  z.object({
    code: z.string().min(1, t('templateEditPage.codeRequired')).max(50, t('templateEditPage.codeMax')),
    name: z.string().min(1, t('templateEditPage.nameRequired')).max(100, t('templateEditPage.nameMax')),
    description: z.string().max(500, t('templateEditPage.descriptionMax')).optional(),
    category: z.string().min(1, t('templateEditPage.categoryRequired')),
    retentionPeriod: z.number().min(1).max(3650).optional(),
    isActive: z.boolean(),
  });

type FormData = z.infer<ReturnType<typeof createFormSchema>>;

export default function ApprovalTemplateEditPage() {
  const { t } = useTranslation('approval');
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const duplicateId = searchParams.get('duplicate');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isNew = !id;

  const formSchema = useMemo(() => createFormSchema(t), [t]);

  const CATEGORIES = [
    { value: 'LEAVE_REQUEST', label: t('templateEditPage.categoryLeave') },
    { value: 'EXPENSE', label: t('templateEditPage.categoryExpense') },
    { value: 'OVERTIME', label: t('templateEditPage.categoryOvertime') },
    { value: 'PERSONNEL', label: t('templateEditPage.categoryPersonnel') },
    { value: 'GENERAL', label: t('templateEditPage.categoryGeneral') },
  ];

  const [approvalLine, setApprovalLine] = useState<ApprovalLineTemplate[]>([]);
  const [routingRules, setRoutingRules] = useState<ConditionalRoutingRule[]>([]);

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
        name: duplicateId ? `${template.name} ${t('templateEditPage.copyNameSuffix')}` : template.name,
        description: template.description || '',
        category: template.category,
        retentionPeriod: template.retentionPeriod || 365,
        isActive: duplicateId ? true : template.isActive,
      });
      setApprovalLine(template.defaultApprovalLine || []);
      setRoutingRules(template.conditionalRoutingRules || []);
    }
  }, [templateData, duplicateId, reset, t]);

  const createMutation = useMutation({
    mutationFn: (data: FormData & { defaultApprovalLine: ApprovalLineTemplate[] }) =>
      approvalService.createTemplate(data),
    onSuccess: () => {
      toast({ title: t('templateEditPage.registerSuccess'), description: t('templateEditPage.registerSuccessDesc') });
      queryClient.invalidateQueries({ queryKey: ['approval-templates'] });
      navigate('/settings/approval-templates');
    },
    onError: () => {
      toast({ title: t('templateEditPage.registerFailure'), description: t('templateEditPage.registerFailureDesc'), variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: FormData & { defaultApprovalLine: ApprovalLineTemplate[] }) =>
      approvalService.updateTemplate(id!, data),
    onSuccess: () => {
      toast({ title: t('templateEditPage.editSuccess'), description: t('templateEditPage.editSuccessDesc') });
      queryClient.invalidateQueries({ queryKey: ['approval-templates'] });
      queryClient.invalidateQueries({ queryKey: ['approval-template', id] });
      navigate('/settings/approval-templates');
    },
    onError: () => {
      toast({ title: t('templateEditPage.editFailure'), description: t('templateEditPage.editFailureDesc'), variant: 'destructive' });
    },
  });

  const onSubmit = (data: FormData) => {
    const payload = {
      ...data,
      defaultApprovalLine: approvalLine,
      conditionalRoutingRules: routingRules,
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
          title={isNew ? t('templateEditPage.registerTitle') : t('templateEditPage.editTitle')}
          description={t('templateEditPage.loadingDesc')}
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
        title={isNew || duplicateId ? t('templateEditPage.registerTitle') : t('templateEditPage.editTitle')}
        description={isNew || duplicateId ? t('templateEditPage.registerDescription') : t('templateEditPage.editDescription')}
        actions={
          <Button variant="outline" onClick={() => navigate('/settings/approval-templates')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('templateEditPage.backToList')}
          </Button>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('templateEditPage.basicInfo')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">
                  {t('templateEditPage.codeLabel')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="code"
                  placeholder={t('templateEditPage.codePlaceholder')}
                  {...register('code')}
                  disabled={!!id}
                />
                {errors.code && (
                  <p className="text-sm text-destructive">{errors.code.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">
                  {t('templateEditPage.categoryLabel')} <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={watch('category')}
                  onValueChange={(value) => setValue('category', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('templateEditPage.categoryPlaceholder')} />
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
                {t('templateEditPage.nameLabel')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder={t('templateEditPage.namePlaceholder')}
                {...register('name')}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('templateEditPage.descriptionLabel')}</Label>
              <Textarea
                id="description"
                placeholder={t('templateEditPage.descriptionPlaceholder')}
                rows={3}
                {...register('description')}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="retentionPeriod">{t('templateEditPage.retentionLabel')}</Label>
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
                  <Label>{t('templateEditPage.activeStatusLabel')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('templateEditPage.activeStatusDescription')}
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
            <CardTitle>{t('templateEditPage.defaultApprovalLine')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {t('templateEditPage.defaultApprovalLineDesc')}
            </p>
            <TemplateLineBuilder
              value={approvalLine}
              onChange={setApprovalLine}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('templateEditPage.conditionalRouting')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {t('templateEditPage.conditionalRoutingDesc')}
            </p>
            <ConditionalRoutingRules
              value={routingRules}
              onChange={setRoutingRules}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/settings/approval-templates')}
          >
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            {isNew || duplicateId ? t('templateEditPage.registerButton') : t('templateEditPage.saveButton')}
          </Button>
        </div>
      </form>
    </>
  );
}
