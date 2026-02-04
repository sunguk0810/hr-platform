import { useForm, useFieldArray, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, Building2, Plus, Trash2, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import type { OrganizationLevel } from '@hr-platform/shared-types';
import { DEFAULT_HIERARCHY_LEVELS } from '@hr-platform/shared-types';

const organizationLevelSchema = z.object({
  levelName: z.string().min(1, '레벨명을 입력하세요'),
  levelOrder: z.number().min(1),
  isRequired: z.boolean(),
});

const hierarchySchema = z.object({
  levels: z.array(organizationLevelSchema).min(1, '최소 1개 이상의 레벨이 필요합니다').max(5, '최대 5개까지 설정 가능합니다'),
});

interface HierarchyFormData {
  levels: OrganizationLevel[];
}

export interface HierarchySettingsProps {
  levels?: OrganizationLevel[];
  onSave: (levels: OrganizationLevel[]) => Promise<void>;
  isLoading?: boolean;
  readOnly?: boolean;
}

export function HierarchySettings({
  levels,
  onSave,
  isLoading = false,
  readOnly = false,
}: HierarchySettingsProps) {
  const methods = useForm<HierarchyFormData>({
    resolver: zodResolver(hierarchySchema),
    defaultValues: {
      levels: levels && levels.length > 0 ? levels : DEFAULT_HIERARCHY_LEVELS,
    },
  });

  const { register, watch, setValue, handleSubmit, control, formState: { errors } } = methods;

  const {
    fields,
    append,
    remove,
    move,
  } = useFieldArray({
    control,
    name: 'levels',
  });

  const handleAddLevel = () => {
    if (fields.length >= 5) return;
    append({
      levelName: '',
      levelOrder: fields.length + 1,
      isRequired: false,
    });
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    move(index, index - 1);
    // Update order values
    const currentLevels = watch('levels');
    currentLevels.forEach((_, i) => {
      setValue(`levels.${i}.levelOrder`, i + 1);
    });
  };

  const handleMoveDown = (index: number) => {
    if (index === fields.length - 1) return;
    move(index, index + 1);
    // Update order values
    const currentLevels = watch('levels');
    currentLevels.forEach((_, i) => {
      setValue(`levels.${i}.levelOrder`, i + 1);
    });
  };

  const handleRemove = (index: number) => {
    if (fields.length <= 1) return;
    remove(index);
    // Update order values
    setTimeout(() => {
      const currentLevels = watch('levels');
      currentLevels.forEach((_, i) => {
        setValue(`levels.${i}.levelOrder`, i + 1);
      });
    }, 0);
  };

  const onSubmit = (data: HierarchyFormData) => {
    onSave(data.levels);
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                조직 계층 구조
              </CardTitle>
              <CardDescription>
                조직의 계층 레벨을 설정합니다. 최대 5단계까지 설정 가능합니다.
              </CardDescription>
            </div>
            {!readOnly && fields.length < 5 && (
              <Button type="button" variant="outline" size="sm" onClick={handleAddLevel}>
                <Plus className="mr-1 h-4 w-4" />
                레벨 추가
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead className="w-20">순서</TableHead>
                  <TableHead>레벨명</TableHead>
                  <TableHead className="text-center w-24">필수 여부</TableHead>
                  <TableHead className="w-24 text-center">이동</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field, index) => (
                  <TableRow key={field.id}>
                    <TableCell>
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">{index + 1}</span>
                    </TableCell>
                    <TableCell>
                      <Input
                        {...register(`levels.${index}.levelName`)}
                        disabled={readOnly}
                        placeholder="예: 본부, 부서, 팀"
                        className="h-8"
                      />
                      {errors.levels?.[index]?.levelName && (
                        <p className="text-xs text-destructive mt-1">
                          {errors.levels[index]?.levelName?.message}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={watch(`levels.${index}.isRequired`)}
                        onCheckedChange={(checked) => setValue(`levels.${index}.isRequired`, checked)}
                        disabled={readOnly}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleMoveUp(index)}
                          disabled={readOnly || index === 0}
                          className="h-7 w-7"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleMoveDown(index)}
                          disabled={readOnly || index === fields.length - 1}
                          className="h-7 w-7"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      {!readOnly && fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemove(index)}
                          className="h-7 w-7"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {errors.levels && !Array.isArray(errors.levels) && (
              <p className="text-sm text-destructive mt-2">{errors.levels.message}</p>
            )}

            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">미리보기</h4>
              <div className="flex flex-col gap-1">
                {fields.map((_, index) => {
                  const levelName = watch(`levels.${index}.levelName`);
                  const isRequired = watch(`levels.${index}.isRequired`);
                  return (
                    <div key={index} className="flex items-center gap-2 text-sm" style={{ paddingLeft: `${index * 16}px` }}>
                      <span className="text-muted-foreground">└</span>
                      <span>{levelName || `레벨 ${index + 1}`}</span>
                      {isRequired && (
                        <span className="text-xs text-primary">(필수)</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {!readOnly && (
          <div className="flex justify-end">
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
          </div>
        )}
      </form>
    </FormProvider>
  );
}
