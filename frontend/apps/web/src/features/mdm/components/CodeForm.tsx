import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
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

// Code Group Form Schema Factory
function createCodeGroupSchema(t: TFunction) {
  return z.object({
    groupCode: z
      .string()
      .min(2, t('form.validation.codeMinLength'))
      .max(50, t('form.validation.codeMaxLength'))
      .regex(/^[A-Z][A-Z0-9_]*$/, t('form.validation.codePattern')),
    groupName: z
      .string()
      .min(1, t('form.validation.codeNameRequired'))
      .max(100, t('form.validation.maxLength100')),
    nameEn: z.string().max(100, t('form.validation.maxLength100')).optional(),
    description: z.string().max(500, t('form.validation.maxLength500')).optional(),
  });
}

type CodeGroupFormData = z.infer<ReturnType<typeof createCodeGroupSchema>>;

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
  const { t } = useTranslation('mdm');
  const isEditMode = !!group;

  const codeGroupSchema = React.useMemo(() => createCodeGroupSchema(t), [t]);

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
          <DialogTitle>{isEditMode ? t('codeGroupForm.editTitle') : t('codeGroupForm.createTitle')}</DialogTitle>
          <DialogDescription>
            {isEditMode ? t('codeGroupForm.editDescription') : t('codeGroupForm.createDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="groupCode">{t('common.labelCodeRequired')}</Label>
            <Input
              id="groupCode"
              {...register('groupCode')}
              placeholder={t('codeGroupForm.codePlaceholder')}
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
                {t('form.codeHint')}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="groupName">{t('common.labelCodeNameRequired')}</Label>
            <Input
              id="groupName"
              {...register('groupName')}
              placeholder={t('codeGroupForm.codeNamePlaceholder')}
              className={errors.groupName ? 'border-destructive' : ''}
            />
            {errors.groupName && (
              <p className="text-sm text-destructive">{errors.groupName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="nameEn">{t('common.labelEnglishName')}</Label>
            <Input
              id="nameEn"
              {...register('nameEn')}
              placeholder={t('codeGroupForm.englishNamePlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('common.labelDescription')}</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder={t('codeGroupForm.descriptionPlaceholder')}
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
              {t('common.cancelButton')}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('common.savingText')}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {t('common.saveButton')}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Common Code Form Schema Factory
function createCommonCodeSchema(t: TFunction) {
  return z.object({
    codeGroupId: z.string().min(1, t('form.validation.codeGroupRequired')),
    code: z
      .string()
      .min(1, t('form.validation.codeRequired'))
      .max(50, t('form.validation.codeMaxLength'))
      .regex(/^[A-Z0-9_]+$/, t('form.validation.commonCodePattern')),
    codeName: z
      .string()
      .min(1, t('form.validation.codeNameRequired'))
      .max(100, t('form.validation.maxLength100')),
    codeNameEn: z.string().max(100, t('form.validation.maxLength100')).optional(),
    description: z.string().max(500, t('form.validation.maxLength500')).optional(),
    sortOrder: z.number().min(0).max(99999),
    active: z.boolean(),
  });
}

type CommonCodeFormData = z.infer<ReturnType<typeof createCommonCodeSchema>>;

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
  const { t } = useTranslation('mdm');
  const isEditMode = !!code;

  const commonCodeSchema = React.useMemo(() => createCommonCodeSchema(t), [t]);

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
          <DialogTitle>{isEditMode ? t('commonCodeForm.editTitle') : t('commonCodeForm.createTitle')}</DialogTitle>
          <DialogDescription>
            {isEditMode ? t('commonCodeForm.editDescription') : t('commonCodeForm.createDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="codeGroupId">{t('commonCodeForm.codeGroupLabel')}</Label>
            <Select
              value={watchGroupId}
              onValueChange={(value) => setValue('codeGroupId', value)}
              disabled={isEditMode}
            >
              <SelectTrigger className={errors.codeGroupId ? 'border-destructive' : ''}>
                <SelectValue placeholder={t('commonCodeForm.codeGroupPlaceholder')} />
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
            <Label htmlFor="code">{t('common.labelCodeRequired')}</Label>
            <Input
              id="code"
              {...register('code')}
              placeholder={t('commonCodeForm.codePlaceholder')}
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
            <Label htmlFor="codeName">{t('common.labelCodeNameRequired')}</Label>
            <Input
              id="codeName"
              {...register('codeName')}
              placeholder={t('commonCodeForm.codeNamePlaceholder')}
              className={errors.codeName ? 'border-destructive' : ''}
            />
            {errors.codeName && (
              <p className="text-sm text-destructive">{errors.codeName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="codeNameEn">{t('common.labelEnglishName')}</Label>
            <Input
              id="codeNameEn"
              {...register('codeNameEn')}
              placeholder={t('commonCodeForm.englishNamePlaceholder')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sortOrder">{t('common.labelSortOrder')}</Label>
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
                <Label>{t('common.labelStatus')}</Label>
                <div className="flex items-center gap-2 pt-2">
                  <Switch
                    checked={watchIsActive}
                    onCheckedChange={(checked) => setValue('active', checked)}
                  />
                  <span className="text-sm">
                    {watchIsActive ? t('common.statusActive') : t('common.statusInactive')}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('common.labelDescription')}</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder={t('commonCodeForm.descriptionPlaceholder')}
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
              {t('common.cancelButton')}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('common.savingText')}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {t('common.saveButton')}
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
  const { t } = useTranslation('mdm');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="space-y-2">
            <p>{t('deleteDialog.confirmMessage')}</p>
            <p>
              <strong className="text-foreground">{itemName}</strong>{' '}
              <span className="font-mono text-muted-foreground">({itemCode})</span>
            </p>
            {hasChildren && (
              <div className="flex items-start gap-2 p-3 mt-2 rounded-md bg-destructive/10 text-destructive">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p className="text-sm">
                  {t('deleteDialog.childWarning', { count: childrenCount })}
                  <br />
                  {t('deleteDialog.childWarningDetail')}
                </p>
              </div>
            )}
            <p className="text-destructive text-sm pt-2">
              {t('common.irreversibleAction')}
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {t('common.cancelButton')}
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('common.deletingText')}
              </>
            ) : (
              t('common.deleteButton')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
