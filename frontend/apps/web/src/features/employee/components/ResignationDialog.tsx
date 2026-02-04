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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useResignation } from '../hooks/useEmployees';
import { useToast } from '@/hooks/useToast';
import type { ResignationType, ResignationRequest, Employee } from '@hr-platform/shared-types';

interface ResignationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee;
  onSuccess?: () => void;
}

interface FormData {
  resignationType: ResignationType;
  resignationDate: string;
  lastWorkingDate: string;
  resignationReason: string;
  handoverEmployeeId: string;
}

const resignationTypeOptions: { value: ResignationType; label: string }[] = [
  { value: 'VOLUNTARY', label: '자발적 퇴사' },
  { value: 'DISMISSAL', label: '해고' },
  { value: 'RETIREMENT', label: '정년퇴직' },
  { value: 'CONTRACT_END', label: '계약만료' },
  { value: 'TRANSFER', label: '전출' },
];

export function ResignationDialog({
  open,
  onOpenChange,
  employee,
  onSuccess,
}: ResignationDialogProps) {
  const { toast } = useToast();
  const resignationMutation = useResignation();
  const [selectedType, setSelectedType] = useState<ResignationType>('VOLUNTARY');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      resignationType: 'VOLUNTARY',
      resignationDate: new Date().toISOString().split('T')[0],
      lastWorkingDate: new Date().toISOString().split('T')[0],
      resignationReason: '',
      handoverEmployeeId: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    const request: ResignationRequest = {
      resignationType: selectedType,
      resignationDate: data.resignationDate,
      lastWorkingDate: data.lastWorkingDate,
      resignationReason: data.resignationReason || undefined,
      handoverEmployeeId: data.handoverEmployeeId || undefined,
    };

    try {
      await resignationMutation.mutateAsync({ id: employee.id, data: request });
      toast({
        title: '퇴직 처리 완료',
        description: `${employee.name}님의 퇴직 처리가 완료되었습니다.`,
      });
      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch {
      toast({
        title: '퇴직 처리 실패',
        description: '퇴직 처리 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>퇴직 처리</DialogTitle>
          <DialogDescription>
            {employee.name}({employee.employeeNumber})님의 퇴직 처리를 진행합니다.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="resignationType">퇴직 유형 *</Label>
            <Select
              value={selectedType}
              onValueChange={(value) => setSelectedType(value as ResignationType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="퇴직 유형 선택" />
              </SelectTrigger>
              <SelectContent>
                {resignationTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="resignationDate">퇴직일 *</Label>
              <Input
                id="resignationDate"
                type="date"
                {...register('resignationDate', { required: '퇴직일을 입력해주세요.' })}
              />
              {errors.resignationDate && (
                <p className="text-sm text-destructive">{errors.resignationDate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastWorkingDate">최종 근무일 *</Label>
              <Input
                id="lastWorkingDate"
                type="date"
                {...register('lastWorkingDate', { required: '최종 근무일을 입력해주세요.' })}
              />
              {errors.lastWorkingDate && (
                <p className="text-sm text-destructive">{errors.lastWorkingDate.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="handoverEmployeeId">인수인계 담당자</Label>
            <Input
              id="handoverEmployeeId"
              placeholder="사번 또는 이름으로 검색"
              {...register('handoverEmployeeId')}
            />
            <p className="text-xs text-muted-foreground">
              업무 인수인계를 담당할 직원을 지정할 수 있습니다.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="resignationReason">퇴직 사유</Label>
            <Textarea
              id="resignationReason"
              placeholder="퇴직 사유를 입력해주세요."
              rows={3}
              {...register('resignationReason')}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={handleClose}>
              취소
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={resignationMutation.isPending}
            >
              {resignationMutation.isPending ? '처리 중...' : '퇴직 처리'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
