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
  resignDate: string;
  lastWorkingDate: string;
  resignationReason: string;
  handoverEmployeeId: string;
}

const RESIGNATION_TYPE_KEYS: ResignationType[] = [
  'VOLUNTARY',
  'DISMISSAL',
  'RETIREMENT',
  'CONTRACT_END',
  'TRANSFER',
];

export function ResignationDialog({
  open,
  onOpenChange,
  employee,
  onSuccess,
}: ResignationDialogProps) {
  const { t } = useTranslation('employee');
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
      resignDate: new Date().toISOString().split('T')[0],
      lastWorkingDate: new Date().toISOString().split('T')[0],
      resignationReason: '',
      handoverEmployeeId: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    const request: ResignationRequest = {
      resignationType: selectedType,
      resignationDate: data.resignDate,
      lastWorkingDate: data.lastWorkingDate,
      resignationReason: data.resignationReason || undefined,
      handoverEmployeeId: data.handoverEmployeeId || undefined,
    };

    try {
      await resignationMutation.mutateAsync({ id: employee.id, data: request });
      toast({
        title: t('resignation.successTitle'),
        description: t('resignation.successDescription', { name: employee.name }),
      });
      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch {
      toast({
        title: t('resignation.failureTitle'),
        description: t('resignation.failureDescription'),
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
          <DialogTitle>{t('resignation.dialogTitle')}</DialogTitle>
          <DialogDescription>
            {t('resignation.dialogDescription', { name: employee.name, employeeNumber: employee.employeeNumber })}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="resignationType">{t('resignation.type')}</Label>
            <Select
              value={selectedType}
              onValueChange={(value) => setSelectedType(value as ResignationType)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('resignation.typePlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {RESIGNATION_TYPE_KEYS.map((key) => (
                  <SelectItem key={key} value={key}>
                    {t(`resignation.typeOptions.${key}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="resignationDate">{t('resignation.resignDate')}</Label>
              <Input
                id="resignationDate"
                type="date"
                {...register('resignDate', { required: t('resignation.resignDateRequired') })}
              />
              {errors.resignDate && (
                <p className="text-sm text-destructive">{errors.resignDate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastWorkingDate">{t('resignation.lastWorkingDate')}</Label>
              <Input
                id="lastWorkingDate"
                type="date"
                {...register('lastWorkingDate', { required: t('resignation.lastWorkingDateRequired') })}
              />
              {errors.lastWorkingDate && (
                <p className="text-sm text-destructive">{errors.lastWorkingDate.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="handoverEmployeeId">{t('resignation.handoverEmployee')}</Label>
            <Input
              id="handoverEmployeeId"
              placeholder={t('resignation.handoverPlaceholder')}
              {...register('handoverEmployeeId')}
            />
            <p className="text-xs text-muted-foreground">
              {t('resignation.handoverDescription')}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="resignationReason">{t('resignation.reason')}</Label>
            <Textarea
              id="resignationReason"
              placeholder={t('resignation.reasonPlaceholder')}
              rows={3}
              {...register('resignationReason')}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={handleClose}>
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={resignationMutation.isPending}
            >
              {resignationMutation.isPending ? t('common.processing') : t('resignation.submitButton')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
