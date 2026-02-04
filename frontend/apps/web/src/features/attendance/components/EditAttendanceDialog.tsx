import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { AlertTriangle } from 'lucide-react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useUpdateAttendanceRecord } from '../hooks/useAttendance';
import { useToast } from '@/hooks/useToast';
import type { AttendanceRecord, AttendanceStatus } from '@hr-platform/shared-types';

interface EditAttendanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: AttendanceRecord | null;
  onSuccess?: () => void;
}

interface FormData {
  checkInTime: string;
  checkOutTime: string;
  attendanceStatus: AttendanceStatus;
  remarks: string;
}

const EDITABLE_STATUSES: { value: AttendanceStatus; label: string }[] = [
  { value: 'NORMAL', label: '정상' },
  { value: 'LATE', label: '지각' },
  { value: 'EARLY_LEAVE', label: '조퇴' },
  { value: 'ABSENT', label: '결근' },
  { value: 'LEAVE', label: '휴가' },
  { value: 'HALF_DAY', label: '반차' },
];

export function EditAttendanceDialog({
  open,
  onOpenChange,
  record,
  onSuccess,
}: EditAttendanceDialogProps) {
  const { toast } = useToast();
  const [showConfirm, setShowConfirm] = useState(false);
  const updateMutation = useUpdateAttendanceRecord();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    defaultValues: {
      checkInTime: '',
      checkOutTime: '',
      attendanceStatus: 'NORMAL',
      remarks: '',
    },
  });

  const watchStatus = watch('attendanceStatus');
  const watchRemarks = watch('remarks');

  useEffect(() => {
    if (record && open) {
      reset({
        checkInTime: record.checkInTime?.slice(0, 5) || '',
        checkOutTime: record.checkOutTime?.slice(0, 5) || '',
        attendanceStatus: record.status,
        remarks: '',
      });
    }
  }, [record, open, reset]);

  const handleFormSubmit = (data: FormData) => {
    if (!data.remarks.trim()) {
      toast({
        title: '입력 오류',
        description: '수정 사유를 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    if (!record) return;

    const formData = watch();

    try {
      await updateMutation.mutateAsync({
        id: record.id,
        data: {
          checkInTime: formData.checkInTime ? `${formData.checkInTime}:00` : undefined,
          checkOutTime: formData.checkOutTime ? `${formData.checkOutTime}:00` : undefined,
          attendanceStatus: formData.attendanceStatus,
          remarks: formData.remarks,
        },
      });

      toast({
        title: '수정 완료',
        description: '근태 기록이 수정되었습니다.',
      });

      setShowConfirm(false);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast({
        title: '수정 실패',
        description: '근태 기록 수정에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  if (!record) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>근태 기록 수정</DialogTitle>
            <DialogDescription>
              근태 기록을 수정합니다. 수정 내역은 감사 로그에 기록됩니다.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            {/* Read-only Info */}
            <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted/50 p-4">
              <div>
                <Label className="text-muted-foreground">날짜</Label>
                <p className="font-medium">
                  {format(new Date(record.date), 'yyyy년 M월 d일 (E)', { locale: ko })}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">사원</Label>
                <p className="font-medium">{record.employeeName}</p>
              </div>
            </div>

            {/* Editable Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="checkInTime">출근 시간</Label>
                <Input
                  id="checkInTime"
                  type="time"
                  {...register('checkInTime')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="checkOutTime">퇴근 시간</Label>
                <Input
                  id="checkOutTime"
                  type="time"
                  {...register('checkOutTime')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="attendanceStatus">근태 상태</Label>
              <Select
                value={watchStatus}
                onValueChange={(value) => setValue('attendanceStatus', value as AttendanceStatus)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="상태 선택" />
                </SelectTrigger>
                <SelectContent>
                  {EDITABLE_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="remarks">
                수정 사유 <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="remarks"
                placeholder="수정 사유를 입력해주세요 (필수)"
                {...register('remarks', { required: '수정 사유를 입력해주세요' })}
                className="min-h-[80px]"
              />
              {errors.remarks && (
                <p className="text-sm text-destructive">{errors.remarks.message}</p>
              )}
            </div>

            {/* Audit Warning */}
            <Alert variant="warning">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                근태 기록 수정 내역은 감사 로그에 기록되며, 관리자가 조회할 수 있습니다.
              </AlertDescription>
            </Alert>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                취소
              </Button>
              <Button
                type="submit"
                disabled={!isDirty || !watchRemarks.trim() || updateMutation.isPending}
              >
                수정
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="근태 기록 수정 확인"
        description="근태 기록을 수정하시겠습니까? 이 작업은 감사 로그에 기록됩니다."
        confirmLabel="수정"
        onConfirm={handleConfirm}
        isLoading={updateMutation.isPending}
      />
    </>
  );
}
