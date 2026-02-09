import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
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
import type { EmployeeTransferType, EmployeeTransferRequest, Employee } from '@hr-platform/shared-types';

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
  transferType: EmployeeTransferType;
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

const TRANSFER_TYPE_KEYS: EmployeeTransferType[] = ['PERMANENT', 'TEMPORARY', 'DISPATCH'];

export function TransferDialog({
  open,
  onOpenChange,
  employee,
  onSuccess,
}: TransferDialogProps) {
  const { t } = useTranslation('employee');
  const { toast } = useToast();
  const transferMutation = useRequestTransfer();
  const [selectedTenant, setSelectedTenant] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [transferType, setTransferType] = useState<EmployeeTransferType>('PERMANENT');

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
        title: t('transfer.inputError'),
        description: t('transfer.inputErrorDesc'),
        variant: 'destructive',
      });
      return;
    }

    const request: EmployeeTransferRequest = {
      targetTenantId: selectedTenant,
      targetDepartmentId: selectedDepartment,
      effectiveDate: data.effectiveDate,
      transferType: transferType,
      reason: data.reason || undefined,
    };

    try {
      await transferMutation.mutateAsync({ id: employee.id, data: request });
      toast({
        title: t('transfer.successTitle'),
        description: t('transfer.successDescription', { name: employee.name }),
      });
      handleClose();
      onSuccess?.();
    } catch {
      toast({
        title: t('transfer.failureTitle'),
        description: t('transfer.failureDescription'),
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
          <DialogTitle>{t('transfer.dialogTitle')}</DialogTitle>
          <DialogDescription>
            {t('transfer.dialogDescription', { name: employee.name, employeeNumber: employee.employeeNumber })}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>{t('transfer.targetCompany')}</Label>
            <Select value={selectedTenant} onValueChange={setSelectedTenant}>
              <SelectTrigger>
                <SelectValue placeholder={t('transfer.targetCompanyPlaceholder')} />
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
            <Label>{t('transfer.targetDepartment')}</Label>
            <Select
              value={selectedDepartment}
              onValueChange={setSelectedDepartment}
              disabled={!selectedTenant}
            >
              <SelectTrigger>
                <SelectValue placeholder={selectedTenant ? t('transfer.targetDepartmentPlaceholder') : t('transfer.targetDepartmentDisabled')} />
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
            <Label htmlFor="effectiveDate">{t('transfer.effectiveDate')}</Label>
            <Input
              id="effectiveDate"
              type="date"
              {...register('effectiveDate', { required: t('transfer.effectiveDateRequired') })}
            />
            {errors.effectiveDate && (
              <p className="text-sm text-destructive">{errors.effectiveDate.message}</p>
            )}
          </div>

          <div className="space-y-3">
            <Label>{t('transfer.transferType')}</Label>
            <RadioGroup
              value={transferType}
              onValueChange={(value: string) => setTransferType(value as EmployeeTransferType)}
              className="space-y-2"
            >
              {TRANSFER_TYPE_KEYS.map((key) => (
                <div key={key} className="flex items-start space-x-3">
                  <RadioGroupItem value={key} id={key} className="mt-1" />
                  <div className="grid gap-0.5">
                    <Label htmlFor={key} className="font-normal cursor-pointer">
                      {t(`transfer.typeOptions.${key}`)}
                    </Label>
                    <p className="text-xs text-muted-foreground">{t(`transfer.typeOptions.${key}_DESC`)}</p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">{t('transfer.reason')}</Label>
            <Textarea
              id="reason"
              placeholder={t('transfer.reasonPlaceholder')}
              rows={3}
              {...register('reason')}
            />
          </div>

          <div className="rounded-lg bg-muted/50 p-3 text-sm">
            <p className="font-medium mb-1">{t('transfer.processNoticeTitle')}</p>
            <ol className="list-decimal list-inside text-muted-foreground space-y-1 text-xs">
              <li>{t('transfer.processStep1')}</li>
              <li>{t('transfer.processStep2')}</li>
              <li>{t('transfer.processStep3')}</li>
            </ol>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={handleClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={transferMutation.isPending}>
              {transferMutation.isPending ? t('common.requesting') : t('transfer.submitButton')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
