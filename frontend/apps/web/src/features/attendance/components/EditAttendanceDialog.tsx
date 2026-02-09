import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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

const EDITABLE_STATUS_KEYS: { value: AttendanceStatus; key: string }[] = [
  { value: 'NORMAL', key: 'components.editAttendanceDialog.editableStatuses.NORMAL' },
  { value: 'LATE', key: 'components.editAttendanceDialog.editableStatuses.LATE' },
  { value: 'EARLY_LEAVE', key: 'components.editAttendanceDialog.editableStatuses.EARLY_LEAVE' },
  { value: 'ABSENT', key: 'components.editAttendanceDialog.editableStatuses.ABSENT' },
  { value: 'LEAVE', key: 'components.editAttendanceDialog.editableStatuses.LEAVE' },
  { value: 'HALF_DAY', key: 'components.editAttendanceDialog.editableStatuses.HALF_DAY' },
];

export function EditAttendanceDialog({
  open,
  onOpenChange,
  record,
  onSuccess,
}: EditAttendanceDialogProps) {
  const { t } = useTranslation('attendance');
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
        title: t('components.editAttendanceDialog.toast.inputError'),
        description: t('components.editAttendanceDialog.toast.remarksRequired'),
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
        title: t('components.editAttendanceDialog.toast.updateSuccess'),
        description: t('components.editAttendanceDialog.toast.updateSuccessMessage'),
      });

      setShowConfirm(false);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast({
        title: t('components.editAttendanceDialog.toast.updateFail'),
        description: t('components.editAttendanceDialog.toast.updateFailMessage'),
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
            <DialogTitle>{t('components.editAttendanceDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('components.editAttendanceDialog.description')}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            {/* Read-only Info */}
            <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted/50 p-4">
              <div>
                <Label className="text-muted-foreground">{t('components.editAttendanceDialog.dateLabel')}</Label>
                <p className="font-medium">
                  {format(new Date(record.date), 'yyyy년 M월 d일 (E)', { locale: ko })}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">{t('components.editAttendanceDialog.employeeLabel')}</Label>
                <p className="font-medium">{record.employeeName}</p>
              </div>
            </div>

            {/* Editable Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="checkInTime">{t('components.editAttendanceDialog.checkInTimeLabel')}</Label>
                <Input
                  id="checkInTime"
                  type="time"
                  {...register('checkInTime')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="checkOutTime">{t('components.editAttendanceDialog.checkOutTimeLabel')}</Label>
                <Input
                  id="checkOutTime"
                  type="time"
                  {...register('checkOutTime')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="attendanceStatus">{t('components.editAttendanceDialog.statusLabel')}</Label>
              <Select
                value={watchStatus}
                onValueChange={(value) => setValue('attendanceStatus', value as AttendanceStatus)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('components.editAttendanceDialog.statusPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {EDITABLE_STATUS_KEYS.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {t(status.key)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="remarks">
                {t('components.editAttendanceDialog.remarksLabel')} <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="remarks"
                placeholder={t('components.editAttendanceDialog.remarksPlaceholder')}
                {...register('remarks', { required: t('components.editAttendanceDialog.remarksRequired') })}
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
                {t('components.editAttendanceDialog.auditWarning')}
              </AlertDescription>
            </Alert>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {t('common:cancel')}
              </Button>
              <Button
                type="submit"
                disabled={!isDirty || !watchRemarks.trim() || updateMutation.isPending}
              >
                {t('components.editAttendanceDialog.submitButton')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title={t('components.editAttendanceDialog.confirmTitle')}
        description={t('components.editAttendanceDialog.confirmDescription')}
        confirmLabel={t('components.editAttendanceDialog.confirmButton')}
        onConfirm={handleConfirm}
        isLoading={updateMutation.isPending}
      />
    </>
  );
}
