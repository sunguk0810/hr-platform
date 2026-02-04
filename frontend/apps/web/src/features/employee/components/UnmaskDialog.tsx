import { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useUnmask } from '../hooks/useEmployees';
import { useToast } from '@/hooks/useToast';
import type { PrivacyField, UnmaskRequest, UnmaskResponse, Employee } from '@hr-platform/shared-types';
import { Eye, AlertTriangle, Shield, Clock } from 'lucide-react';

interface UnmaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee;
}

interface FormData {
  purpose: string;
}

const privacyFieldOptions: { value: PrivacyField; label: string; description: string }[] = [
  { value: 'residentNumber', label: '주민등록번호', description: '주민등록번호 전체' },
  { value: 'bankAccount', label: '계좌번호', description: '급여 계좌 정보' },
  { value: 'address', label: '주소', description: '거주지 주소' },
  { value: 'mobile', label: '휴대전화', description: '개인 연락처' },
  { value: 'phone', label: '전화번호', description: '자택/직장 전화번호' },
  { value: 'birthDate', label: '생년월일', description: '생년월일 전체' },
];

export function UnmaskDialog({ open, onOpenChange, employee }: UnmaskDialogProps) {
  const { toast } = useToast();
  const unmaskMutation = useUnmask();
  const [selectedFields, setSelectedFields] = useState<PrivacyField[]>([]);
  const [unmaskedData, setUnmaskedData] = useState<UnmaskResponse | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      purpose: '',
    },
  });

  const toggleField = (field: PrivacyField) => {
    setSelectedFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]
    );
  };

  const onSubmit = async (data: FormData) => {
    if (selectedFields.length === 0) {
      toast({
        title: '선택 필요',
        description: '열람할 개인정보 항목을 선택해주세요.',
        variant: 'destructive',
      });
      return;
    }

    const request: UnmaskRequest = {
      fields: selectedFields,
      purpose: data.purpose,
    };

    try {
      const response = await unmaskMutation.mutateAsync({ id: employee.id, data: request });
      setUnmaskedData(response.data);
      toast({
        title: '열람 승인',
        description: '개인정보 열람이 승인되었습니다. 열람 기록이 저장됩니다.',
      });
    } catch {
      toast({
        title: '열람 실패',
        description: '개인정보 열람 요청 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleClose = () => {
    reset();
    setSelectedFields([]);
    setUnmaskedData(null);
    onOpenChange(false);
  };

  const formatValidUntil = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            개인정보 열람 요청
          </DialogTitle>
          <DialogDescription>
            {employee.name}({employee.employeeNumber})님의 마스킹된 개인정보를 열람합니다.
          </DialogDescription>
        </DialogHeader>

        {!unmaskedData ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Alert variant="default" className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertTitle className="text-yellow-800 dark:text-yellow-200">주의</AlertTitle>
              <AlertDescription className="text-yellow-700 dark:text-yellow-300 text-sm">
                개인정보 열람은 업무상 필요한 경우에만 허용됩니다.
                모든 열람 기록은 감사 로그에 저장됩니다.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <Label>열람할 정보 선택 *</Label>
              <div className="grid grid-cols-2 gap-3">
                {privacyFieldOptions.map((option) => (
                  <div
                    key={option.value}
                    className={`flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedFields.includes(option.value)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => toggleField(option.value)}
                  >
                    <Checkbox
                      checked={selectedFields.includes(option.value)}
                      onCheckedChange={() => toggleField(option.value)}
                    />
                    <div className="grid gap-0.5">
                      <Label className="font-normal cursor-pointer">{option.label}</Label>
                      <p className="text-xs text-muted-foreground">{option.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="purpose">열람 목적 *</Label>
              <Textarea
                id="purpose"
                placeholder="개인정보 열람 목적을 구체적으로 입력해주세요."
                rows={3}
                {...register('purpose', {
                  required: '열람 목적을 입력해주세요.',
                  minLength: { value: 10, message: '열람 목적을 10자 이상 입력해주세요.' },
                })}
              />
              {errors.purpose && (
                <p className="text-sm text-destructive">{errors.purpose.message}</p>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={handleClose}>
                취소
              </Button>
              <Button type="submit" disabled={unmaskMutation.isPending}>
                {unmaskMutation.isPending ? '요청 중...' : '열람 요청'}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>유효 시간: {formatValidUntil(unmaskedData.validUntil)}</span>
            </div>

            <div className="space-y-3">
              {selectedFields.map((field) => {
                const option = privacyFieldOptions.find((o) => o.value === field);
                const value = unmaskedData.data[field];
                return (
                  <div key={field} className="p-3 rounded-lg border bg-muted/30">
                    <div className="flex items-center gap-2 mb-1">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{option?.label}</span>
                    </div>
                    <p className="font-mono text-sm pl-6">{value || '-'}</p>
                  </div>
                );
              })}
            </div>

            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription className="text-sm">
                열람 기록이 감사 로그에 저장되었습니다.
                <br />
                로그 ID: {unmaskedData.accessLogId}
              </AlertDescription>
            </Alert>

            <DialogFooter>
              <Button onClick={handleClose}>닫기</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
