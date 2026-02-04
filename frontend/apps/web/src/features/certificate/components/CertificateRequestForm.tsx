import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { useCertificateTypes, useCreateCertificateRequest } from '../hooks/useCertificates';
import type { CertificateLanguage, CreateCertificateRequestRequest } from '@hr-platform/shared-types';
import { CERTIFICATE_LANGUAGE_LABELS } from '@hr-platform/shared-types';

interface CertificateRequestFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CertificateRequestForm({ open, onOpenChange, onSuccess }: CertificateRequestFormProps) {
  const { data: typesData } = useCertificateTypes();
  const createMutation = useCreateCertificateRequest();

  const [formData, setFormData] = useState<{
    certificateTypeCode: string;
    purpose: string;
    submissionTarget: string;
    copies: number;
    language: CertificateLanguage;
    includeSalary: boolean;
  }>({
    certificateTypeCode: '',
    purpose: '',
    submissionTarget: '',
    copies: 1,
    language: 'KO',
    includeSalary: false,
  });

  const certificateTypes = typesData?.data ?? [];
  const selectedType = certificateTypes.find(t => t.code === formData.certificateTypeCode);

  const handleSubmit = async () => {
    if (!formData.certificateTypeCode) return;

    try {
      const data: CreateCertificateRequestRequest = {
        certificateTypeCode: formData.certificateTypeCode,
        purpose: formData.purpose || undefined,
        submissionTarget: formData.submissionTarget || undefined,
        copies: formData.copies,
        language: formData.language,
        includeSalary: formData.includeSalary,
      };
      await createMutation.mutateAsync(data);
      onOpenChange(false);
      resetForm();
      onSuccess?.();
    } catch (error) {
      console.error('Failed to create certificate request:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      certificateTypeCode: '',
      purpose: '',
      submissionTarget: '',
      copies: 1,
      language: 'KO',
      includeSalary: false,
    });
  };

  const calculateFee = () => {
    if (!selectedType) return 0;
    return selectedType.fee * formData.copies;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>증명서 신청</DialogTitle>
          <DialogDescription>
            필요한 증명서를 신청합니다. 승인 후 발급됩니다.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>증명서 유형 *</Label>
            <Select
              value={formData.certificateTypeCode}
              onValueChange={(value) =>
                setFormData(prev => ({ ...prev, certificateTypeCode: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="증명서 유형 선택" />
              </SelectTrigger>
              <SelectContent>
                {certificateTypes.map((type) => (
                  <SelectItem key={type.code} value={type.code}>
                    {type.name}
                    {type.fee > 0 && ` (${type.fee.toLocaleString()}원)`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedType && (
            <Card className="bg-muted/50">
              <CardContent className="p-3">
                <div className="text-sm space-y-1">
                  <p>{selectedType.description}</p>
                  <div className="flex gap-4 text-muted-foreground">
                    <span>유효기간: {selectedType.validDays}일</span>
                    <span>최대 발급: {selectedType.maxCopiesPerRequest}부</span>
                    {selectedType.requiresApproval && <span>결재 필요</span>}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-2">
            <Label>발급 언어 *</Label>
            <Select
              value={formData.language}
              onValueChange={(value) =>
                setFormData(prev => ({ ...prev, language: value as CertificateLanguage }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CERTIFICATE_LANGUAGE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>발급 부수 *</Label>
            <Input
              type="number"
              min={1}
              max={selectedType?.maxCopiesPerRequest ?? 10}
              value={formData.copies}
              onChange={(e) =>
                setFormData(prev => ({ ...prev, copies: parseInt(e.target.value) || 1 }))
              }
            />
          </div>

          <div className="grid gap-2">
            <Label>용도</Label>
            <Input
              value={formData.purpose}
              onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
              placeholder="예: 대출신청, 비자발급"
            />
          </div>

          <div className="grid gap-2">
            <Label>제출처</Label>
            <Input
              value={formData.submissionTarget}
              onChange={(e) =>
                setFormData(prev => ({ ...prev, submissionTarget: e.target.value }))
              }
              placeholder="예: 은행, 대사관"
            />
          </div>

          {selectedType?.code === 'EMPLOYMENT' && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeSalary"
                checked={formData.includeSalary}
                onCheckedChange={(checked) =>
                  setFormData(prev => ({ ...prev, includeSalary: checked as boolean }))
                }
              />
              <Label htmlFor="includeSalary" className="text-sm font-normal">
                급여 정보 포함
              </Label>
            </div>
          )}

          {selectedType && selectedType.fee > 0 && (
            <div className="rounded-md bg-muted p-3 text-sm">
              발급 수수료: <strong>{calculateFee().toLocaleString()}원</strong>
              {formData.copies > 1 && ` (${selectedType.fee.toLocaleString()}원 × ${formData.copies}부)`}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              resetForm();
            }}
          >
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!formData.certificateTypeCode || createMutation.isPending}
          >
            {createMutation.isPending ? '신청 중...' : '신청하기'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
