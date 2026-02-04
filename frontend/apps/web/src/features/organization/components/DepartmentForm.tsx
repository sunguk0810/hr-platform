import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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

const departmentSchema = z.object({
  code: z.string().min(1, '부서코드를 입력해주세요.').max(20, '20자 이내로 입력해주세요.'),
  name: z.string().min(1, '부서명을 입력해주세요.').max(100, '100자 이내로 입력해주세요.'),
  nameEn: z.string().max(100, '100자 이내로 입력해주세요.').optional(),
  parentId: z.string().optional(),
  description: z.string().max(500, '500자 이내로 입력해주세요.').optional(),
});

type DepartmentFormData = z.infer<typeof departmentSchema>;

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
  const isEditMode = !!department;

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
          <DialogTitle>{isEditMode ? '부서 수정' : '부서 추가'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? '부서 정보를 수정합니다.' : '새로운 부서를 추가합니다.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <div className="grid gap-4 py-4">
            {/* Parent Department */}
            {!isEditMode && (
              <div className="grid gap-2">
                <Label htmlFor="parentId">상위부서</Label>
                <Select
                  value={parentId || 'none'}
                  onValueChange={(value) =>
                    setValue('parentId', value === 'none' ? undefined : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="상위부서 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">(최상위)</SelectItem>
                    {flatDepartments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {'　'.repeat(dept.level - 1)}
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Department Code */}
            <div className="grid gap-2">
              <Label htmlFor="code">부서코드 *</Label>
              <Input
                id="code"
                {...register('code')}
                placeholder="예: DEV-FE"
                disabled={isEditMode}
                className={errors.code ? 'border-destructive' : ''}
              />
              {errors.code && (
                <p className="text-sm text-destructive">{errors.code.message}</p>
              )}
            </div>

            {/* Department Name */}
            <div className="grid gap-2">
              <Label htmlFor="name">부서명 *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="예: 프론트엔드팀"
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            {/* English Name */}
            <div className="grid gap-2">
              <Label htmlFor="nameEn">영문명</Label>
              <Input
                id="nameEn"
                {...register('nameEn')}
                placeholder="예: Frontend Team"
              />
              {errors.nameEn && (
                <p className="text-sm text-destructive">{errors.nameEn.message}</p>
              )}
            </div>

            {/* Description */}
            {!isEditMode && (
              <div className="grid gap-2">
                <Label htmlFor="description">설명</Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  placeholder="부서에 대한 설명을 입력하세요."
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
              취소
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  저장 중...
                </>
              ) : (
                '저장'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
