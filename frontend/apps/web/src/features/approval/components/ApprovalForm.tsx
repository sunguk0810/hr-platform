import * as React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileUpload } from '@/components/common/FileUpload/FileUpload';
import { ApprovalLineBuilder, type ApprovalLineStep } from './ApprovalLineBuilder';
import { DocumentTemplateSelector, type DocumentTemplate } from './DocumentTemplateSelector';
import { Loader2, Save, Send } from 'lucide-react';
import type { ApprovalType, CreateApprovalRequest, ApproverOption } from '@hr-platform/shared-types';

const createApprovalSchema = (t: TFunction) => z.object({
  documentType: z.enum(['LEAVE_REQUEST', 'EXPENSE', 'OVERTIME', 'PERSONNEL', 'GENERAL'] as const),
  title: z.string().min(1, t('approvalForm.titleValidation')).max(200, t('approvalForm.titleMaxValidation')),
  content: z.string().min(1, t('approvalForm.contentValidation')),
  urgency: z.enum(['NORMAL', 'HIGH'] as const),
});

type ApprovalFormData = z.infer<ReturnType<typeof createApprovalSchema>>;

export interface ApprovalFormProps {
  templates?: DocumentTemplate[];
  onSubmit: (data: CreateApprovalRequest, isDraft: boolean) => Promise<void>;
  onCancel?: () => void;
  onSearchApprovers?: (keyword: string) => Promise<ApproverOption[]>;
  isLoading?: boolean;
  defaultType?: ApprovalType;
}

const APPROVAL_TYPE_OPTION_KEYS: { value: ApprovalType; labelKey: string }[] = [
  { value: 'LEAVE_REQUEST', labelKey: 'type.leaveRequest' },
  { value: 'EXPENSE', labelKey: 'type.expense' },
  { value: 'OVERTIME', labelKey: 'type.overtime' },
  { value: 'PERSONNEL', labelKey: 'type.personnel' },
  { value: 'GENERAL', labelKey: 'type.general' },
];

export function ApprovalForm({
  templates = [],
  onSubmit,
  onCancel,
  onSearchApprovers,
  isLoading = false,
  defaultType = 'GENERAL',
}: ApprovalFormProps) {
  const { t } = useTranslation('approval');
  const [approvalSteps, setApprovalSteps] = React.useState<ApprovalLineStep[]>([]);
  const [attachments, setAttachments] = React.useState<File[]>([]);
  const [selectedTemplate, setSelectedTemplate] = React.useState<DocumentTemplate | null>(null);

  const approvalSchema = React.useMemo(() => createApprovalSchema(t), [t]);

  const methods = useForm<ApprovalFormData>({
    resolver: zodResolver(approvalSchema),
    defaultValues: {
      documentType: defaultType,
      title: '',
      content: '',
      urgency: 'NORMAL',
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = methods;

  const type = watch('documentType');

  const handleTemplateSelect = (template: DocumentTemplate) => {
    setSelectedTemplate(template);
    setValue('title', template.name);
    setValue('content', template.content);
    if (template.defaultApprovalLine) {
      setApprovalSteps(template.defaultApprovalLine);
    }
  };

  const handleFormSubmit = async (data: ApprovalFormData, isDraft: boolean) => {
    const submitData: CreateApprovalRequest = {
      ...data,
      approvalLines: approvalSteps
        .filter((step) => step.approverId)
        .map((step) => ({
          approverId: step.approverId!,
          approverName: step.approverName,
        })),
      submitImmediately: !isDraft,
      attachmentIds: [], // Would be uploaded separately
    };

    await onSubmit(submitData, isDraft);
  };

  const isValid = watch('title') && watch('content') && approvalSteps.length > 0;

  return (
    <FormProvider {...methods}>
      <form className="space-y-6">
        {/* Document Type & Template */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('approvalForm.documentType')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>{t('approvalForm.typeRequired')}</Label>
                <Select
                  value={type}
                  onValueChange={(value) => setValue('documentType', value as ApprovalType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {APPROVAL_TYPE_OPTION_KEYS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {t(option.labelKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t('approvalForm.urgency')}</Label>
                <Select
                  value={watch('urgency')}
                  onValueChange={(value) => setValue('urgency', value as 'NORMAL' | 'HIGH')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NORMAL">{t('approvalForm.urgencyNormal')}</SelectItem>
                    <SelectItem value="HIGH">{t('approvalForm.urgencyHigh')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Template Selector */}
            {templates.length > 0 && (
              <DocumentTemplateSelector
                templates={templates.filter((t) => t.type === type)}
                selectedTemplate={selectedTemplate}
                onSelect={handleTemplateSelect}
              />
            )}
          </CardContent>
        </Card>

        {/* Document Content */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('approvalForm.documentContent')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">{t('approvalForm.titleRequired')}</Label>
              <Input
                id="title"
                {...register('title')}
                placeholder={t('approvalForm.titlePlaceholder')}
                className={errors.title ? 'border-destructive' : ''}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">{t('approvalForm.contentRequired')}</Label>
              <Textarea
                id="content"
                {...register('content')}
                placeholder={t('approvalForm.contentPlaceholder')}
                rows={10}
                className={errors.content ? 'border-destructive' : ''}
              />
              {errors.content && (
                <p className="text-sm text-destructive">{errors.content.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Approval Line */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('approvalForm.approvalLine')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ApprovalLineBuilder
              steps={approvalSteps}
              onChange={setApprovalSteps}
              onSearchApprovers={onSearchApprovers}
              maxSteps={5}
            />
            {approvalSteps.length === 0 && (
              <p className="text-sm text-destructive mt-2">
                {t('approvalForm.minApproverValidation')}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Attachments */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('approvalForm.attachments')}</CardTitle>
          </CardHeader>
          <CardContent>
            <FileUpload
              value={attachments}
              onChange={setAttachments}
              multiple
              maxFiles={5}
              maxSize={10 * 1024 * 1024}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif"
              placeholder={t('approvalForm.fileUploadPlaceholder')}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              {t('common.cancel')}
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={handleSubmit((data) => handleFormSubmit(data, true))}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {t('approvalForm.saveDraft')}
          </Button>
          <Button
            type="button"
            onClick={handleSubmit((data) => handleFormSubmit(data, false))}
            disabled={isLoading || !isValid}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            {t('approvalForm.submitRequest')}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
