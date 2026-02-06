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
  groupCode: z
    .string()
    .min(2, '코드는 2자 이상이어야 합니다.')
    .max(50, '코드는 50자 이내여야 합니다.')
    .regex(/^[A-Z][A-Z0-9_]*$/, '영문 대문자로 시작하고, 영문 대문자/숫자/언더스코어만 사용 가능합니다.'),
  groupName: z
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
      groupCode: '',
      groupName: '',
      nameEn: '',
      description: '',
    },
  });

  React.useEffect(() => {
    if (open) {
      if (group) {
        reset({
          groupCode: group.groupCode,
          groupName: group.groupName,
          nameEn: '',
          description: group.description || '',
        });
      } else {
        reset({
          groupCode: '',
          groupName: '',
          nameEn: '',
          description: '',
        });
      }
    }
  }, [open, group, reset]);

  const handleFormSubmit = async (data: CodeGroupFormData) => {
    if (isEditMode) {
      const updateData: UpdateCodeGroupRequest = {
        groupName: data.groupName,
        groupNameEn: data.nameEn || undefined,
        description: data.description || undefined,
      };
      await onSubmit(updateData);
    } else {
      const createData: CreateCodeGroupRequest = {
        groupCode: data.groupCode,
        groupName: data.groupName,
        groupNameEn: data.nameEn || undefined,
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
            <Label htmlFor="groupCode">코드 *</Label>
            <Input
              id="groupCode"
              {...register('groupCode')}
              placeholder="예: LEAVE_TYPE"
              disabled={isEditMode}
              className={errors.groupCode ? 'border-destructive' : ''}
              onChange={(e) => {
                e.target.value = e.target.value.toUpperCase();
              }}
            />
            {errors.groupCode && (
              <p className="text-sm text-destructive">{errors.groupCode.message}</p>
            )}
            {!isEditMode && (
              <p className="text-xs text-muted-foreground">
                영문 대문자로 시작, 영문 대문자/숫자/언더스코어 사용 가능
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="groupName">코드명 *</Label>
            <Input
              id="groupName"
              {...register('groupName')}
              placeholder="예: 휴가유형"
              className={errors.groupName ? 'border-destructive' : ''}
            />
            {errors.groupName && (
              <p className="text-sm text-destructive">{errors.groupName.message}</p>
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
  codeGroupId: z.string().min(1, '코드그룹을 선택해주세요.'),
  code: z
    .string()
    .min(1, '코드를 입력해주세요.')
    .max(50, '코드는 50자 이내여야 합니다.')
    .regex(/^[A-Z0-9_]+$/, '영문 대문자, 숫자, 언더스코어만 사용 가능합니다.'),
  codeName: z
    .string()
    .min(1, '코드명을 입력해주세요.')
    .max(100, '100자 이내로 입력해주세요.'),
  codeNameEn: z.string().max(100, '100자 이내로 입력해주세요.').optional(),
  description: z.string().max(500, '500자 이내로 입력해주세요.').optional(),
  sortOrder: z.number().min(0).max(99999),
  active: z.boolean(),
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
    codeName: string;
    codeNameEn?: string;
    sortOrder: number;
    active: boolean;
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
      codeGroupId: '',
      code: '',
      codeName: '',
      codeNameEn: '',
      description: '',
      sortOrder: 0,
      active: true,
    },
  });

  const watchGroupId = watch('codeGroupId');
  const watchIsActive = watch('active');

  React.useEffect(() => {
    if (open) {
      if (code) {
        const group = codeGroups.find((g) => g.groupCode === code.groupCode);
        reset({
          codeGroupId: code.groupId || group?.id || '',
          code: code.code,
          codeName: code.codeName,
          codeNameEn: code.codeNameEn || '',
          description: '',
          sortOrder: code.sortOrder,
          active: code.active,
        });
      } else {
        reset({
          codeGroupId: defaultGroupId || '',
          code: '',
          codeName: '',
          codeNameEn: '',
          description: '',
          sortOrder: 0,
          active: true,
        });
      }
    }
  }, [open, code, codeGroups, defaultGroupId, reset]);

  const handleFormSubmit = async (data: CommonCodeFormData) => {
    if (isEditMode) {
      const updateData: UpdateCommonCodeRequest = {
        codeName: data.codeName,
        codeNameEn: data.codeNameEn || undefined,
        description: data.description || undefined,
        sortOrder: data.sortOrder,
        status: data.active ? 'ACTIVE' : 'INACTIVE',
      };
      await onSubmit(updateData);
    } else {
      const createData: CreateCommonCodeRequest = {
        codeGroupId: data.codeGroupId,
        code: data.code,
        codeName: data.codeName,
        codeNameEn: data.codeNameEn || undefined,
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
            <Label htmlFor="codeGroupId">코드그룹 *</Label>
            <Select
              value={watchGroupId}
              onValueChange={(value) => setValue('codeGroupId', value)}
              disabled={isEditMode}
            >
              <SelectTrigger className={errors.codeGroupId ? 'border-destructive' : ''}>
                <SelectValue placeholder="코드그룹 선택" />
              </SelectTrigger>
              <SelectContent>
                {codeGroups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.groupName} ({group.groupCode})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.codeGroupId && (
              <p className="text-sm text-destructive">{errors.codeGroupId.message}</p>
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
            <Label htmlFor="codeName">코드명 *</Label>
            <Input
              id="codeName"
              {...register('codeName')}
              placeholder="예: 연차"
              className={errors.codeName ? 'border-destructive' : ''}
            />
            {errors.codeName && (
              <p className="text-sm text-destructive">{errors.codeName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="codeNameEn">영문명</Label>
            <Input
              id="codeNameEn"
              {...register('codeNameEn')}
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
                    onCheckedChange={(checked) => setValue('active', checked)}
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
