import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import type { Department, CreateDepartmentRequest, UpdateDepartmentRequest, DepartmentTreeNode } from '@hr-platform/shared-types';

function createDepartmentSchema(t: (key: string) => string) {
  return z.object({
    code: z.string().min(1, t('department.validation.codeRequired')).max(20, t('department.validation.codeMaxLength')),
    name: z.string().min(1, t('department.validation.nameRequired')).max(100, t('department.validation.nameMaxLength')),
    nameEn: z.string().max(100, t('department.validation.nameEnMaxLength')).optional(),
    parentId: z.string().optional(),
    description: z.string().max(500, t('department.validation.descriptionMaxLength')).optional(),
  });
}

type DepartmentFormData = z.infer<ReturnType<typeof createDepartmentSchema>>;

export interface DepartmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department?: Department;
  parentDepartments: DepartmentTreeNode[];
  onSubmit: (data: CreateDepartmentRequest | UpdateDepartmentRequest) => Promise<void>;
  isLoading?: boolean;
}

export function DepartmentForm({
  open,
  onOpenChange,
  department,
  parentDepartments,
  onSubmit,
  isLoading = false,
}: DepartmentFormProps) {
  const { t } = useTranslation('organization');
  const { t: tCommon } = useTranslation('common');
  const isEditMode = !!department;
  const departmentSchema = createDepartmentSchema(t);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<DepartmentFormData>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      code: '',
      name: '',
      nameEn: '',
      parentId: undefined,
      description: '',
    },
  });

  React.useEffect(() => {
    if (open) {
      if (department) {
        reset({
          code: department.code,
          name: department.name,
          nameEn: department.nameEn || '',
          parentId: department.parentId || undefined,
          description: '',
        });
      } else {
        reset({
          code: '',
          name: '',
          nameEn: '',
          parentId: undefined,
          description: '',
        });
      }
    }
  }, [open, department, reset]);

  // Flatten department tree
  const flattenTree = (
    nodes: DepartmentTreeNode[],
    result: { id: string; name: string; level: number }[] = [],
    excludeId?: string
  ): { id: string; name: string; level: number }[] => {
    nodes.forEach((node) => {
      if (node.id !== excludeId) {
        result.push({ id: node.id, name: node.name, level: node.level });
        if (node.children) {
          flattenTree(node.children, result, excludeId);
        }
      }
    });
    return result;
  };

  // Exclude current department and its children from parent options
  const flatDepartments = flattenTree(parentDepartments, [], department?.id);

  const handleFormSubmit = async (data: DepartmentFormData) => {
    if (isEditMode) {
      const updateData: UpdateDepartmentRequest = {
        name: data.name,
        nameEn: data.nameEn || undefined,
      };
      await onSubmit(updateData);
    } else {
      const createData: CreateDepartmentRequest = {
        code: data.code,
        name: data.name,
        nameEn: data.nameEn || undefined,
        parentId: data.parentId || undefined,
      };
      await onSubmit(createData);
    }
  };

  const parentId = watch('parentId');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? t('department.edit') : t('department.add')}</DialogTitle>
          <DialogDescription>
            {isEditMode ? t('department.editDescription') : t('department.addDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <div className="grid gap-4 py-4">
            {/* Parent Department */}
            {!isEditMode && (
              <div className="grid gap-2">
                <Label htmlFor="parentId">{t('department.parentDepartment')}</Label>
                <Select
                  value={parentId || 'none'}
                  onValueChange={(value) =>
                    setValue('parentId', value === 'none' ? undefined : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('department.selectParent')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t('department.topLevel')}</SelectItem>
                    {flatDepartments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {'\u3000'.repeat(Math.max(0, dept.level - 1))}
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Department Code */}
            <div className="grid gap-2">
              <Label htmlFor="code">{t('department.code')} *</Label>
              <Input
                id="code"
                {...register('code')}
                placeholder={t('department.placeholders.code')}
                disabled={isEditMode}
                className={errors.code ? 'border-destructive' : ''}
              />
              {errors.code && (
                <p className="text-sm text-destructive">{errors.code.message}</p>
              )}
            </div>

            {/* Department Name */}
            <div className="grid gap-2">
              <Label htmlFor="name">{t('department.name')} *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder={t('department.placeholders.name')}
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            {/* English Name */}
            <div className="grid gap-2">
              <Label htmlFor="nameEn">{tCommon('englishName')}</Label>
              <Input
                id="nameEn"
                {...register('nameEn')}
                placeholder={t('department.placeholders.englishName')}
              />
              {errors.nameEn && (
                <p className="text-sm text-destructive">{errors.nameEn.message}</p>
              )}
            </div>

            {/* Description */}
            {!isEditMode && (
              <div className="grid gap-2">
                <Label htmlFor="description">{tCommon('description')}</Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  placeholder={t('department.placeholders.description')}
                  rows={3}
                />
                {errors.description && (
                  <p className="text-sm text-destructive">{errors.description.message}</p>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              {tCommon('cancel')}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {tCommon('saving')}
                </>
              ) : (
                tCommon('save')
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
