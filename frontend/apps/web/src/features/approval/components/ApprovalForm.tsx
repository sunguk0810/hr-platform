import * as React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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

const approvalSchema = z.object({
  type: z.enum(['LEAVE_REQUEST', 'EXPENSE', 'OVERTIME', 'PERSONNEL', 'GENERAL'] as const),
  title: z.string().min(1, '제목을 입력해주세요.').max(200, '200자 이내로 입력해주세요.'),
  content: z.string().min(1, '내용을 입력해주세요.'),
  urgency: z.enum(['NORMAL', 'HIGH'] as const),
});

type ApprovalFormData = z.infer<typeof approvalSchema>;

export interface ApprovalFormProps {
  templates?: DocumentTemplate[];
  onSubmit: (data: CreateApprovalRequest, isDraft: boolean) => Promise<void>;
  onCancel?: () => void;
  onSearchApprovers?: (keyword: string) => Promise<ApproverOption[]>;
  isLoading?: boolean;
  defaultType?: ApprovalType;
}

const APPROVAL_TYPE_OPTIONS: { value: ApprovalType; label: string }[] = [
  { value: 'LEAVE_REQUEST', label: '휴가신청' },
  { value: 'EXPENSE', label: '경비청구' },
  { value: 'OVERTIME', label: '초과근무' },
  { value: 'PERSONNEL', label: '인사관련' },
  { value: 'GENERAL', label: '일반기안' },
];

export function ApprovalForm({
  templates = [],
  onSubmit,
  onCancel,
  onSearchApprovers,
  isLoading = false,
  defaultType = 'GENERAL',
}: ApprovalFormProps) {
  const [approvalSteps, setApprovalSteps] = React.useState<ApprovalLineStep[]>([]);
  const [attachments, setAttachments] = React.useState<File[]>([]);
  const [selectedTemplate, setSelectedTemplate] = React.useState<DocumentTemplate | null>(null);

  const methods = useForm<ApprovalFormData>({
    resolver: zodResolver(approvalSchema),
    defaultValues: {
      type: defaultType,
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

  const type = watch('type');

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
      approverIds: approvalSteps
        .filter((step) => step.approverId)
        .map((step) => step.approverId!),
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
            <CardTitle className="text-base">문서 유형</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>유형 *</Label>
                <Select
                  value={type}
                  onValueChange={(value) => setValue('type', value as ApprovalType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {APPROVAL_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>긴급도</Label>
                <Select
                  value={watch('urgency')}
                  onValueChange={(value) => setValue('urgency', value as 'NORMAL' | 'HIGH')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NORMAL">일반</SelectItem>
                    <SelectItem value="HIGH">긴급</SelectItem>
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
            <CardTitle className="text-base">문서 내용</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">제목 *</Label>
              <Input
                id="title"
                {...register('title')}
                placeholder="결재 문서 제목을 입력하세요"
                className={errors.title ? 'border-destructive' : ''}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">내용 *</Label>
              <Textarea
                id="content"
                {...register('content')}
                placeholder="결재 문서 내용을 입력하세요"
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
            <CardTitle className="text-base">결재선</CardTitle>
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
                결재자를 최소 1명 이상 추가해주세요.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Attachments */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">첨부파일</CardTitle>
          </CardHeader>
          <CardContent>
            <FileUpload
              value={attachments}
              onChange={setAttachments}
              multiple
              maxFiles={5}
              maxSize={10 * 1024 * 1024}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif"
              placeholder="파일을 드래그하거나 클릭하여 업로드하세요 (최대 5개, 각 10MB)"
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              취소
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
            임시저장
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
            결재 요청
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
