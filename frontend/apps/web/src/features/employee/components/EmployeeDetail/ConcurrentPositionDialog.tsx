import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/common/Form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/common/DatePicker';
import { useToast } from '@/hooks/useToast';
import { useOrganizationTree, usePositions, useGrades } from '@/features/organization/hooks/useOrganization';
import {
  useCreateConcurrentPosition,
  useUpdateConcurrentPosition,
} from '../../hooks/useEmployees';
import type { ConcurrentPosition, DepartmentTreeNode } from '@hr-platform/shared-types';

const createConcurrentPositionSchema = (t: TFunction) =>
  z.object({
    departmentId: z.string().min(1, t('concurrentPosition.departmentRequired')),
    positionId: z.string().optional(),
    gradeId: z.string().optional(),
    isPrimary: z.boolean().default(false),
    startDate: z.date({ required_error: t('concurrentPosition.startDateRequired') }),
    endDate: z.date().optional().nullable(),
    reason: z.string().optional(),
  });

type ConcurrentPositionFormData = z.infer<ReturnType<typeof createConcurrentPositionSchema>>;

interface ConcurrentPositionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
  employeeName?: string;
  position?: ConcurrentPosition | null;
  existingPositions?: ConcurrentPosition[];
}

export function ConcurrentPositionDialog({
  open,
  onOpenChange,
  employeeId,
  employeeName,
  position,
  existingPositions = [],
}: ConcurrentPositionDialogProps) {
  const { t } = useTranslation('employee');
  const concurrentPositionSchema = React.useMemo(() => createConcurrentPositionSchema(t), [t]);

  const { toast } = useToast();
  const isEditing = !!position;

  const { data: treeData } = useOrganizationTree();
  const { data: positionsData } = usePositions();
  const { data: gradesData } = useGrades();

  const createMutation = useCreateConcurrentPosition();
  const updateMutation = useUpdateConcurrentPosition();

  const form = useForm<ConcurrentPositionFormData>({
    resolver: zodResolver(concurrentPositionSchema),
    defaultValues: {
      departmentId: '',
      positionId: '',
      gradeId: '',
      isPrimary: false,
      startDate: new Date(),
      endDate: null,
      reason: '',
    },
  });

  useEffect(() => {
    if (open) {
      if (position) {
        form.reset({
          departmentId: position.departmentId,
          positionId: position.positionId || '',
          gradeId: position.gradeId || '',
          isPrimary: position.isPrimary,
          startDate: new Date(position.startDate),
          endDate: position.endDate ? new Date(position.endDate) : null,
          reason: position.reason || '',
        });
      } else {
        form.reset({
          departmentId: '',
          positionId: '',
          gradeId: '',
          isPrimary: false,
          startDate: new Date(),
          endDate: null,
          reason: '',
        });
      }
    }
  }, [open, position, form]);

  // Flatten department tree for select
  const flattenTree = (
    nodes: DepartmentTreeNode[],
    result: { id: string; name: string; level: number }[] = [],
    level = 0
  ): { id: string; name: string; level: number }[] => {
    nodes.forEach((node) => {
      result.push({ id: node.id, name: node.name, level });
      if (node.children && node.children.length > 0) {
        flattenTree(node.children, result, level + 1);
      }
    });
    return result;
  };

  const departments = treeData?.data ? flattenTree(treeData.data) : [];
  const positions_list = positionsData?.data ?? [];
  const grades = gradesData?.data ?? [];

  // Check if department is already in use
  const getDisabledDepartments = () => {
    if (isEditing) {
      return existingPositions
        .filter((p) => p.id !== position?.id && p.status === 'ACTIVE')
        .map((p) => p.departmentId);
    }
    return existingPositions
      .filter((p) => p.status === 'ACTIVE')
      .map((p) => p.departmentId);
  };
  const disabledDepartments = getDisabledDepartments();

  const hasPrimaryPosition = existingPositions.some(
    (p) => p.isPrimary && p.status === 'ACTIVE' && p.id !== position?.id
  );

  const handleSubmit = async (values: ConcurrentPositionFormData) => {
    try {
      if (isEditing && position) {
        await updateMutation.mutateAsync({
          employeeId,
          positionId: position.id,
          data: {
            positionId: values.positionId || undefined,
            gradeId: values.gradeId || undefined,
            endDate: values.endDate ? format(values.endDate, 'yyyy-MM-dd') : undefined,
            reason: values.reason || undefined,
          },
        });
        toast({
          title: t('toast.updateComplete'),
          description: t('concurrentPosition.updateSuccess'),
        });
      } else {
        await createMutation.mutateAsync({
          employeeId,
          departmentId: values.departmentId,
          positionId: values.positionId || undefined,
          gradeId: values.gradeId || undefined,
          isPrimary: values.isPrimary,
          startDate: format(values.startDate, 'yyyy-MM-dd'),
          endDate: values.endDate ? format(values.endDate, 'yyyy-MM-dd') : undefined,
          reason: values.reason || undefined,
        });
        toast({
          title: t('toast.addComplete'),
          description: values.isPrimary
            ? t('concurrentPosition.addPrimarySuccess')
            : t('concurrentPosition.addSuccess'),
        });
      }
      onOpenChange(false);
    } catch {
      toast({
        title: isEditing ? t('concurrentPosition.updateFailure') : t('concurrentPosition.addFailure'),
        description: t('concurrentPosition.processFailure'),
        variant: 'destructive',
      });
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? t('concurrentPosition.editDialogTitle') : t('concurrentPosition.addDialogTitle')}</DialogTitle>
          <DialogDescription>
            {employeeName
              ? isEditing
                ? t('concurrentPosition.editDescriptionWithName', { name: employeeName })
                : t('concurrentPosition.addDescriptionWithName', { name: employeeName })
              : isEditing
                ? t('concurrentPosition.editDescription')
                : t('concurrentPosition.addDescription')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="departmentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('concurrentPosition.department')}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isEditing}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('concurrentPosition.departmentPlaceholder')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem
                          key={dept.id}
                          value={dept.id}
                          disabled={disabledDepartments.includes(dept.id)}
                        >
                          {'\u3000'.repeat(dept.level)}
                          {dept.name}
                          {disabledDepartments.includes(dept.id) && ` ${t('concurrentPosition.alreadyAssigned')}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="positionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('concurrentPosition.positionLabel')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('concurrentPosition.positionPlaceholder')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">{t('common.noSelection')}</SelectItem>
                        {positions_list.map((pos) => (
                          <SelectItem key={pos.id} value={pos.id}>
                            {pos.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gradeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('concurrentPosition.gradeLabel')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('concurrentPosition.gradePlaceholder')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">{t('common.noSelection')}</SelectItem>
                        {grades.map((grade) => (
                          <SelectItem key={grade.id} value={grade.id}>
                            {grade.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('concurrentPosition.startDate')}</FormLabel>
                    <FormControl>
                      <DatePicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder={t('concurrentPosition.startDatePlaceholder')}
                        disabled={isEditing}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('concurrentPosition.endDate')}</FormLabel>
                    <FormControl>
                      <DatePicker
                        value={field.value ?? undefined}
                        onChange={field.onChange}
                        placeholder={t('concurrentPosition.endDatePlaceholder')}
                      />
                    </FormControl>
                    <FormDescription>{t('concurrentPosition.endDateDescription')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {!isEditing && (
              <FormField
                control={form.control}
                name="isPrimary"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={hasPrimaryPosition && !field.value}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>{t('concurrentPosition.setPrimary')}</FormLabel>
                      <FormDescription>
                        {hasPrimaryPosition
                          ? t('concurrentPosition.setPrimaryAlreadyExists')
                          : t('concurrentPosition.setPrimaryDescription')}
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('concurrentPosition.reasonLabel')}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder={t('concurrentPosition.reasonPlaceholder')}
                      rows={2}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? t('common.processing') : isEditing ? t('common.edit') : t('common.add')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default ConcurrentPositionDialog;
