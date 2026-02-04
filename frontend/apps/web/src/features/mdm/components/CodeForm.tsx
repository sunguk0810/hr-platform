import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
import { Loader2, Save, AlertTriangle } from 'lucide-react';
import type {
  CodeGroupListItem,
  CreateCodeGroupRequest,
  UpdateCodeGroupRequest,
  CreateCommonCodeRequest,
  UpdateCommonCodeRequest,
} from '@hr-platform/shared-types';

// Code Group Form Schema
const codeGroupSchema = z.object({
  code: z
    .string()
    .min(2, '코드는 2자 이상이어야 합니다.')
    .max(50, '코드는 50자 이내여야 합니다.')
    .regex(/^[A-Z][A-Z0-9_]*$/, '영문 대문자로 시작하고, 영문 대문자/숫자/언더스코어만 사용 가능합니다.'),
  name: z
    .string()
    .min(1, '코드명을 입력해주세요.')
    .max(100, '100자 이내로 입력해주세요.'),
  nameEn: z.string().max(100, '100자 이내로 입력해주세요.').optional(),
  description: z.string().max(500, '500자 이내로 입력해주세요.').optional(),
});

type CodeGroupFormData = z.infer<typeof codeGroupSchema>;

export interface CodeGroupFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group?: CodeGroupListItem;
  onSubmit: (data: CreateCodeGroupRequest | UpdateCodeGroupRequest) => Promise<void>;
  isLoading?: boolean;
}

export function CodeGroupForm({
  open,
  onOpenChange,
  group,
  onSubmit,
  isLoading = false,
}: CodeGroupFormProps) {
  const isEditMode = !!group;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CodeGroupFormData>({
    resolver: zodResolver(codeGroupSchema),
    defaultValues: {
      code: '',
      name: '',
      nameEn: '',
      description: '',
    },
  });

  React.useEffect(() => {
    if (open) {
      if (group) {
        reset({
          code: group.code,
          name: group.name,
          nameEn: '',
          description: group.description || '',
        });
      } else {
        reset({
          code: '',
          name: '',
          nameEn: '',
          description: '',
        });
      }
    }
  }, [open, group, reset]);

  const handleFormSubmit = async (data: CodeGroupFormData) => {
    if (isEditMode) {
      const updateData: UpdateCodeGroupRequest = {
        name: data.name,
        nameEn: data.nameEn || undefined,
        description: data.description || undefined,
      };
      await onSubmit(updateData);
    } else {
      const createData: CreateCodeGroupRequest = {
        code: data.code,
        name: data.name,
        nameEn: data.nameEn || undefined,
        description: data.description || undefined,
      };
      await onSubmit(createData);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? '코드그룹 수정' : '코드그룹 추가'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? '코드그룹 정보를 수정합니다.' : '새로운 코드그룹을 추가합니다.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">코드 *</Label>
            <Input
              id="code"
              {...register('code')}
              placeholder="예: LEAVE_TYPE"
              disabled={isEditMode}
              className={errors.code ? 'border-destructive' : ''}
              onChange={(e) => {
                e.target.value = e.target.value.toUpperCase();
              }}
            />
            {errors.code && (
              <p className="text-sm text-destructive">{errors.code.message}</p>
            )}
            {!isEditMode && (
              <p className="text-xs text-muted-foreground">
                영문 대문자로 시작, 영문 대문자/숫자/언더스코어 사용 가능
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">코드명 *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="예: 휴가유형"
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="nameEn">영문명</Label>
            <Input
              id="nameEn"
              {...register('nameEn')}
              placeholder="예: Leave Type"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">설명</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="코드그룹에 대한 설명을 입력하세요."
              rows={3}
            />
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
                <>
                  <Save className="mr-2 h-4 w-4" />
                  저장
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Common Code Form Schema
const commonCodeSchema = z.object({
  groupId: z.string().min(1, '코드그룹을 선택해주세요.'),
  code: z
    .string()
    .min(1, '코드를 입력해주세요.')
    .max(50, '코드는 50자 이내여야 합니다.')
    .regex(/^[A-Z0-9_]+$/, '영문 대문자, 숫자, 언더스코어만 사용 가능합니다.'),
  name: z
    .string()
    .min(1, '코드명을 입력해주세요.')
    .max(100, '100자 이내로 입력해주세요.'),
  nameEn: z.string().max(100, '100자 이내로 입력해주세요.').optional(),
  description: z.string().max(500, '500자 이내로 입력해주세요.').optional(),
  sortOrder: z.number().min(0).max(99999),
  isActive: z.boolean(),
});

type CommonCodeFormData = z.infer<typeof commonCodeSchema>;

export interface CommonCodeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  code?: {
    id: string;
    groupId?: string;
    groupCode: string;
    code: string;
    name: string;
    nameEn?: string;
    sortOrder: number;
    isActive: boolean;
  };
  codeGroups: CodeGroupListItem[];
  defaultGroupId?: string;
  onSubmit: (data: CreateCommonCodeRequest | UpdateCommonCodeRequest) => Promise<void>;
  isLoading?: boolean;
}

export function CommonCodeForm({
  open,
  onOpenChange,
  code,
  codeGroups,
  defaultGroupId,
  onSubmit,
  isLoading = false,
}: CommonCodeFormProps) {
  const isEditMode = !!code;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CommonCodeFormData>({
    resolver: zodResolver(commonCodeSchema),
    defaultValues: {
      groupId: '',
      code: '',
      name: '',
      nameEn: '',
      description: '',
      sortOrder: 0,
      isActive: true,
    },
  });

  const watchGroupId = watch('groupId');
  const watchIsActive = watch('isActive');

  React.useEffect(() => {
    if (open) {
      if (code) {
        const group = codeGroups.find((g) => g.code === code.groupCode);
        reset({
          groupId: code.groupId || group?.id || '',
          code: code.code,
          name: code.name,
          nameEn: code.nameEn || '',
          description: '',
          sortOrder: code.sortOrder,
          isActive: code.isActive,
        });
      } else {
        reset({
          groupId: defaultGroupId || '',
          code: '',
          name: '',
          nameEn: '',
          description: '',
          sortOrder: 0,
          isActive: true,
        });
      }
    }
  }, [open, code, codeGroups, defaultGroupId, reset]);

  const handleFormSubmit = async (data: CommonCodeFormData) => {
    if (isEditMode) {
      const updateData: UpdateCommonCodeRequest = {
        name: data.name,
        nameEn: data.nameEn || undefined,
        description: data.description || undefined,
        sortOrder: data.sortOrder,
        isActive: data.isActive,
      };
      await onSubmit(updateData);
    } else {
      const createData: CreateCommonCodeRequest = {
        groupId: data.groupId,
        code: data.code,
        name: data.name,
        nameEn: data.nameEn || undefined,
        description: data.description || undefined,
        sortOrder: data.sortOrder || undefined,
      };
      await onSubmit(createData);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? '공통코드 수정' : '공통코드 추가'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? '공통코드 정보를 수정합니다.' : '새로운 공통코드를 추가합니다.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="groupId">코드그룹 *</Label>
            <Select
              value={watchGroupId}
              onValueChange={(value) => setValue('groupId', value)}
              disabled={isEditMode}
            >
              <SelectTrigger className={errors.groupId ? 'border-destructive' : ''}>
                <SelectValue placeholder="코드그룹 선택" />
              </SelectTrigger>
              <SelectContent>
                {codeGroups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name} ({group.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.groupId && (
              <p className="text-sm text-destructive">{errors.groupId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="code">코드 *</Label>
            <Input
              id="code"
              {...register('code')}
              placeholder="예: ANNUAL"
              disabled={isEditMode}
              className={errors.code ? 'border-destructive' : ''}
              onChange={(e) => {
                e.target.value = e.target.value.toUpperCase();
              }}
            />
            {errors.code && (
              <p className="text-sm text-destructive">{errors.code.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">코드명 *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="예: 연차"
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="nameEn">영문명</Label>
            <Input
              id="nameEn"
              {...register('nameEn')}
              placeholder="예: Annual Leave"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sortOrder">정렬순서</Label>
              <Input
                id="sortOrder"
                type="number"
                {...register('sortOrder', { valueAsNumber: true })}
                min={0}
                max={99999}
              />
            </div>

            {isEditMode && (
              <div className="space-y-2">
                <Label>상태</Label>
                <div className="flex items-center gap-2 pt-2">
                  <Switch
                    checked={watchIsActive}
                    onCheckedChange={(checked) => setValue('isActive', checked)}
                  />
                  <span className="text-sm">
                    {watchIsActive ? '활성' : '비활성'}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">설명</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="코드에 대한 설명을 입력하세요."
              rows={2}
            />
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
                <>
                  <Save className="mr-2 h-4 w-4" />
                  저장
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Delete confirmation dialog
export interface CodeDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  itemName: string;
  itemCode: string;
  hasChildren?: boolean;
  childrenCount?: number;
  onConfirm: () => Promise<void>;
  isLoading?: boolean;
}

export function CodeDeleteDialog({
  open,
  onOpenChange,
  title,
  itemName,
  itemCode,
  hasChildren = false,
  childrenCount = 0,
  onConfirm,
  isLoading = false,
}: CodeDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="space-y-2">
            <p>정말로 삭제하시겠습니까?</p>
            <p>
              <strong className="text-foreground">{itemName}</strong>{' '}
              <span className="font-mono text-muted-foreground">({itemCode})</span>
            </p>
            {hasChildren && (
              <div className="flex items-start gap-2 p-3 mt-2 rounded-md bg-destructive/10 text-destructive">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p className="text-sm">
                  이 코드그룹에는 {childrenCount}개의 하위 코드가 있습니다.
                  <br />
                  코드그룹을 삭제하면 모든 하위 코드도 함께 삭제됩니다.
                </p>
              </div>
            )}
            <p className="text-destructive text-sm pt-2">
              이 작업은 되돌릴 수 없습니다.
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            취소
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                삭제 중...
              </>
            ) : (
              '삭제'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
