import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
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

const concurrentPositionSchema = z.object({
  departmentId: z.string().min(1, '부서를 선택해주세요'),
  positionId: z.string().optional(),
  gradeId: z.string().optional(),
  isPrimary: z.boolean().default(false),
  startDate: z.date({ required_error: '시작일을 선택해주세요' }),
  endDate: z.date().optional().nullable(),
  reason: z.string().optional(),
});

type ConcurrentPositionFormData = z.infer<typeof concurrentPositionSchema>;

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
          title: '수정 완료',
          description: '소속 정보가 수정되었습니다.',
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
          title: '추가 완료',
          description: values.isPrimary
            ? '주소속이 추가되었습니다.'
            : '겸직이 추가되었습니다.',
        });
      }
      onOpenChange(false);
    } catch {
      toast({
        title: isEditing ? '수정 실패' : '추가 실패',
        description: '소속 정보 처리 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? '소속 정보 수정' : '겸직 추가'}</DialogTitle>
          <DialogDescription>
            {employeeName
              ? `${employeeName} 직원의 ${isEditing ? '소속 정보를 수정합니다.' : '새로운 겸직을 추가합니다.'}`
              : isEditing
                ? '소속 정보를 수정합니다.'
                : '새로운 겸직을 추가합니다.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="departmentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>부서 *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isEditing}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="부서 선택" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem
                          key={dept.id}
                          value={dept.id}
                          disabled={disabledDepartments.includes(dept.id)}
                        >
                          {'　'.repeat(dept.level)}
                          {dept.name}
                          {disabledDepartments.includes(dept.id) && ' (이미 소속됨)'}
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
                    <FormLabel>직위</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="직위 선택" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">선택 안함</SelectItem>
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
                    <FormLabel>직급</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="직급 선택" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">선택 안함</SelectItem>
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
                    <FormLabel>시작일 *</FormLabel>
                    <FormControl>
                      <DatePicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="시작일 선택"
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
                    <FormLabel>종료일</FormLabel>
                    <FormControl>
                      <DatePicker
                        value={field.value ?? undefined}
                        onChange={field.onChange}
                        placeholder="종료일 선택 (선택)"
                      />
                    </FormControl>
                    <FormDescription>미입력 시 기간 제한 없음</FormDescription>
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
                      <FormLabel>주소속으로 설정</FormLabel>
                      <FormDescription>
                        {hasPrimaryPosition
                          ? '이미 주소속이 있습니다. 주소속을 변경하려면 기존 주소속을 먼저 변경해주세요.'
                          : '이 부서를 주소속으로 설정합니다. 주소속은 1개만 지정할 수 있습니다.'}
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
                  <FormLabel>사유</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="겸직 사유를 입력하세요 (선택)"
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
                취소
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? '처리 중...' : isEditing ? '수정' : '추가'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default ConcurrentPositionDialog;
