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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRequestTransfer } from '../hooks/useEmployees';
import { useToast } from '@/hooks/useToast';
import type { TransferType, TransferRequest, Employee } from '@hr-platform/shared-types';

interface TransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee;
  onSuccess?: () => void;
}

interface FormData {
  targetTenantId: string;
  targetDepartmentId: string;
  effectiveDate: string;
  transferType: TransferType;
  reason: string;
}

// 임시 테넌트 목록 (실제로는 API에서 조회)
const mockTenants = [
  { id: 'tenant-002', name: '삼성전자' },
  { id: 'tenant-003', name: '삼성디스플레이' },
  { id: 'tenant-004', name: '삼성SDI' },
  { id: 'tenant-005', name: '삼성SDS' },
];

// 임시 부서 목록 (실제로는 테넌트 선택 시 API에서 조회)
const mockDepartments = [
  { id: 'dept-001', name: '개발본부 > 플랫폼팀' },
  { id: 'dept-002', name: '개발본부 > 서비스팀' },
  { id: 'dept-003', name: '경영지원본부 > 인사팀' },
  { id: 'dept-004', name: '경영지원본부 > 재무팀' },
];

const transferTypeOptions: { value: TransferType; label: string; description: string }[] = [
  { value: 'PERMANENT', label: '영구 전출', description: '완전한 소속 변경' },
  { value: 'TEMPORARY', label: '임시 전출', description: '일정 기간 후 복귀 예정' },
  { value: 'DISPATCH', label: '파견', description: '소속은 유지하며 파견 근무' },
];

export function TransferDialog({
  open,
  onOpenChange,
  employee,
  onSuccess,
}: TransferDialogProps) {
  const { toast } = useToast();
  const transferMutation = useRequestTransfer();
  const [selectedTenant, setSelectedTenant] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [transferType, setTransferType] = useState<TransferType>('PERMANENT');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      effectiveDate: '',
      reason: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    if (!selectedTenant || !selectedDepartment) {
      toast({
        title: '입력 오류',
        description: '전출 대상 회사와 부서를 선택해주세요.',
        variant: 'destructive',
      });
      return;
    }

    const request: TransferRequest = {
      targetTenantId: selectedTenant,
      targetDepartmentId: selectedDepartment,
      effectiveDate: data.effectiveDate,
      transferType: transferType,
      reason: data.reason || undefined,
    };

    try {
      await transferMutation.mutateAsync({ id: employee.id, data: request });
      toast({
        title: '전출 요청 완료',
        description: `${employee.name}님의 전출 요청이 접수되었습니다.`,
      });
      handleClose();
      onSuccess?.();
    } catch {
      toast({
        title: '전출 요청 실패',
        description: '전출 요청 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleClose = () => {
    reset();
    setSelectedTenant('');
    setSelectedDepartment('');
    setTransferType('PERMANENT');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>계열사 전출 요청</DialogTitle>
          <DialogDescription>
            {employee.name}({employee.employeeNumber})님의 계열사 전출을 요청합니다.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>전출 대상 회사 *</Label>
            <Select value={selectedTenant} onValueChange={setSelectedTenant}>
              <SelectTrigger>
                <SelectValue placeholder="전출 대상 회사 선택" />
              </SelectTrigger>
              <SelectContent>
                {mockTenants.map((tenant) => (
                  <SelectItem key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>전입 부서 *</Label>
            <Select
              value={selectedDepartment}
              onValueChange={setSelectedDepartment}
              disabled={!selectedTenant}
            >
              <SelectTrigger>
                <SelectValue placeholder={selectedTenant ? '전입 부서 선택' : '회사를 먼저 선택해주세요'} />
              </SelectTrigger>
              <SelectContent>
                {mockDepartments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="effectiveDate">발령일 *</Label>
            <Input
              id="effectiveDate"
              type="date"
              {...register('effectiveDate', { required: '발령일을 입력해주세요.' })}
            />
            {errors.effectiveDate && (
              <p className="text-sm text-destructive">{errors.effectiveDate.message}</p>
            )}
          </div>

          <div className="space-y-3">
            <Label>전출 유형 *</Label>
            <RadioGroup
              value={transferType}
              onValueChange={(value: string) => setTransferType(value as TransferType)}
              className="space-y-2"
            >
              {transferTypeOptions.map((option) => (
                <div key={option.value} className="flex items-start space-x-3">
                  <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
                  <div className="grid gap-0.5">
                    <Label htmlFor={option.value} className="font-normal cursor-pointer">
                      {option.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">전출 사유</Label>
            <Textarea
              id="reason"
              placeholder="전출 사유를 입력해주세요."
              rows={3}
              {...register('reason')}
            />
          </div>

          <div className="rounded-lg bg-muted/50 p-3 text-sm">
            <p className="font-medium mb-1">전출 절차 안내</p>
            <ol className="list-decimal list-inside text-muted-foreground space-y-1 text-xs">
              <li>전출 요청 접수 후 현 소속사 승인이 필요합니다.</li>
              <li>현 소속사 승인 후 전입사 승인이 진행됩니다.</li>
              <li>양측 승인 완료 시 발령일에 전출이 확정됩니다.</li>
            </ol>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={handleClose}>
              취소
            </Button>
            <Button type="submit" disabled={transferMutation.isPending}>
              {transferMutation.isPending ? '요청 중...' : '전출 요청'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
