import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ComboBox, type ComboBoxOption } from '@/components/common/Form/ComboBox';
import { APPOINTMENT_TYPE_LABELS, type AppointmentType } from '@hr-platform/shared-types';

const createAppointmentDetailSchema = (t: TFunction) => z.object({
  employeeId: z.string().min(1, t('detailFormValidation.employeeRequired')),
  appointmentType: z.string().min(1, t('detailFormValidation.typeRequired')),
  toDepartmentId: z.string().optional(),
  toPositionCode: z.string().optional(),
  toGradeCode: z.string().optional(),
  toJobCode: z.string().optional(),
  reason: z.string().optional(),
});

type AppointmentDetailFormData = z.infer<ReturnType<typeof createAppointmentDetailSchema>>;

interface AppointmentDetailFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: AppointmentDetailFormData) => void;
  isLoading?: boolean;
}

// Mock data - in real app, these would come from API
const mockEmployees: ComboBoxOption[] = [
  { value: 'emp-002', label: '김철수', description: '개발1팀 / 대리' },
  { value: 'emp-003', label: '이영희', description: '인사팀 / 대리' },
  { value: 'emp-004', label: '박민수', description: '개발1팀 / 과장' },
  { value: 'emp-005', label: '최수진', description: '영업팀 / 사원' },
  { value: 'emp-006', label: '정대현', description: '재무팀 / 과장' },
  { value: 'emp-007', label: '강민지', description: '개발2팀 / 대리' },
];

const mockDepartments: ComboBoxOption[] = [
  { value: 'dept-001', label: '개발1팀' },
  { value: 'dept-002', label: '인사팀' },
  { value: 'dept-003', label: '기획팀' },
  { value: 'dept-004', label: '영업팀' },
  { value: 'dept-005', label: '재무팀' },
  { value: 'dept-006', label: '개발2팀' },
];

const mockPositions: ComboBoxOption[] = [
  { value: 'pos-001', label: '팀장' },
  { value: 'pos-002', label: '팀원' },
  { value: 'pos-003', label: '선임' },
  { value: 'pos-004', label: '파트장' },
];

const mockGrades: ComboBoxOption[] = [
  { value: 'grade-001', label: '부장' },
  { value: 'grade-002', label: '과장' },
  { value: 'grade-003', label: '대리' },
  { value: 'grade-004', label: '사원' },
];

const appointmentTypes = Object.entries(APPOINTMENT_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

// Types that require department change
const requiresDepartment: AppointmentType[] = ['TRANSFER', 'CONCURRENT'];
// Types that require grade change
const requiresGrade: AppointmentType[] = ['PROMOTION', 'DEMOTION'];
// Types that require position change
const requiresPosition: AppointmentType[] = ['POSITION_CHANGE', 'CONCURRENT'];

export function AppointmentDetailForm({
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
}: AppointmentDetailFormProps) {
  const { t } = useTranslation('appointment');
  const [selectedType, setSelectedType] = useState<AppointmentType | ''>('');

  const appointmentDetailSchema = useMemo(() => createAppointmentDetailSchema(t), [t]);

  const form = useForm<AppointmentDetailFormData>({
    resolver: zodResolver(appointmentDetailSchema),
    defaultValues: {
      employeeId: '',
      appointmentType: '',
      toDepartmentId: undefined,
      toPositionCode: undefined,
      toGradeCode: undefined,
      toJobCode: undefined,
      reason: '',
    },
  });

  useEffect(() => {
    if (!open) {
      form.reset();
      setSelectedType('');
    }
  }, [open, form]);

  const handleTypeChange = (value: string) => {
    setSelectedType(value as AppointmentType);
    form.setValue('appointmentType', value);
    // Clear fields that aren't relevant for this type
    if (!requiresDepartment.includes(value as AppointmentType)) {
      form.setValue('toDepartmentId', undefined);
    }
    if (!requiresGrade.includes(value as AppointmentType)) {
      form.setValue('toGradeCode', undefined);
    }
    if (!requiresPosition.includes(value as AppointmentType)) {
      form.setValue('toPositionCode', undefined);
    }
  };

  const handleSubmit = form.handleSubmit((data) => {
    onSubmit(data);
    onOpenChange(false);
  });

  const showDepartment = requiresDepartment.includes(selectedType as AppointmentType);
  const showGrade = requiresGrade.includes(selectedType as AppointmentType);
  const showPosition = requiresPosition.includes(selectedType as AppointmentType);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('detailForm.title')}</DialogTitle>
          <DialogDescription>
            {t('detailForm.description')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="employeeId">{t('detailForm.employeeLabel')}</Label>
            <ComboBox
              options={mockEmployees}
              value={form.watch('employeeId')}
              onChange={(value) => form.setValue('employeeId', value || '')}
              placeholder={t('detailForm.employeePlaceholder')}
              searchPlaceholder={t('detailForm.employeeSearchPlaceholder')}
            />
            {form.formState.errors.employeeId && (
              <p className="text-sm text-destructive">
                {form.formState.errors.employeeId.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="appointmentType">{t('detailForm.appointmentType')}</Label>
            <Select value={selectedType} onValueChange={handleTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder={t('detailForm.appointmentTypeSelect')} />
              </SelectTrigger>
              <SelectContent>
                {appointmentTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.appointmentType && (
              <p className="text-sm text-destructive">
                {form.formState.errors.appointmentType.message}
              </p>
            )}
          </div>

          {showDepartment && (
            <div className="space-y-2">
              <Label htmlFor="toDepartmentId">{t('detailForm.targetDepartment')}</Label>
              <ComboBox
                options={mockDepartments}
                value={form.watch('toDepartmentId')}
                onChange={(value) => form.setValue('toDepartmentId', value)}
                placeholder={t('detailForm.departmentSelect')}
                clearable
              />
            </div>
          )}

          {showGrade && (
            <div className="space-y-2">
              <Label htmlFor="toGradeCode">{t('detailForm.targetGrade')}</Label>
              <ComboBox
                options={mockGrades}
                value={form.watch('toGradeCode')}
                onChange={(value) => form.setValue('toGradeCode', value)}
                placeholder={t('detailForm.gradeSelect')}
                clearable
              />
            </div>
          )}

          {showPosition && (
            <div className="space-y-2">
              <Label htmlFor="toPositionCode">{t('detailForm.targetPosition')}</Label>
              <ComboBox
                options={mockPositions}
                value={form.watch('toPositionCode')}
                onChange={(value) => form.setValue('toPositionCode', value)}
                placeholder={t('detailForm.positionSelect')}
                clearable
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="reason">{t('detailForm.reason')}</Label>
            <Textarea
              id="reason"
              placeholder={t('detailForm.reasonPlaceholder')}
              {...form.register('reason')}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('detailForm.cancel')}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? t('detailForm.adding') : t('detailForm.add')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
