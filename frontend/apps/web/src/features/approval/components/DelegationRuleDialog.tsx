import { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import {
  useDelegationRule,
  useCreateDelegationRule,
  useUpdateDelegationRule,
  useEmployeeSearch,
} from '../hooks/useApprovals';
import type {
  DelegationRuleConditionType,
  DelegationRuleTargetType,
  ApprovalType,
  CreateDelegationRuleRequest,
  UpdateDelegationRuleRequest,
} from '@hr-platform/shared-types';
import {
  DELEGATION_RULE_CONDITION_LABELS,
  DELEGATION_RULE_TARGET_LABELS,
} from '@hr-platform/shared-types';

const APPROVAL_TYPE_LABELS: Record<ApprovalType, string> = {
  LEAVE_REQUEST: '휴가신청',
  EXPENSE: '경비청구',
  OVERTIME: '초과근무',
  PERSONNEL: '인사발령',
  GENERAL: '일반',
};

const delegationRuleSchema = z.object({
  name: z.string().min(1, '규칙명을 입력해주세요').max(100),
  description: z.string().max(500).optional(),
  delegatorId: z.string().min(1, '위임자를 선택해주세요'),
  conditionType: z.enum(['DOCUMENT_TYPE', 'AMOUNT_RANGE', 'ABSENCE', 'ALWAYS'] as const),
  documentTypes: z.array(z.string()).optional(),
  minAmount: z.number().optional(),
  maxAmount: z.number().optional(),
  absenceDays: z.number().optional(),
  targetType: z.enum(['SPECIFIC', 'ROLE', 'DEPARTMENT_HEAD', 'DEPUTY'] as const),
  targetEmployeeId: z.string().optional(),
  targetRole: z.string().optional(),
  priority: z.number().min(1).max(999),
  validFrom: z.string().optional(),
  validTo: z.string().optional(),
});

type DelegationRuleFormData = z.infer<typeof delegationRuleSchema>;

interface DelegationRuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingRuleId?: string;
}

export function DelegationRuleDialog({
  open,
  onOpenChange,
  editingRuleId,
}: DelegationRuleDialogProps) {
  const { toast } = useToast();
  const isEditMode = !!editingRuleId;

  const [delegatorSearch, setDelegatorSearch] = useState('');
  const [targetSearch, setTargetSearch] = useState('');
  const [selectedDelegator, setSelectedDelegator] = useState<{
    id: string;
    name: string;
    departmentName: string;
  } | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<{
    id: string;
    name: string;
    departmentName: string;
  } | null>(null);

  const { data: existingRule, isLoading: isLoadingRule } = useDelegationRule(
    editingRuleId || ''
  );
  const { data: delegatorResults } = useEmployeeSearch(delegatorSearch);
  const { data: targetResults } = useEmployeeSearch(targetSearch);
  const createMutation = useCreateDelegationRule();
  const updateMutation = useUpdateDelegationRule();

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<DelegationRuleFormData>({
    resolver: zodResolver(delegationRuleSchema),
    defaultValues: {
      name: '',
      description: '',
      delegatorId: '',
      conditionType: 'ALWAYS',
      documentTypes: [],
      priority: 10,
      targetType: 'DEPARTMENT_HEAD',
    },
  });

  const conditionType = watch('conditionType');
  const targetType = watch('targetType');

  // Load existing rule data when editing
  useEffect(() => {
    if (isEditMode && existingRule?.data) {
      const rule = existingRule.data;
      reset({
        name: rule.name,
        description: rule.description || '',
        delegatorId: rule.delegatorId,
        conditionType: rule.condition.type,
        documentTypes: rule.condition.documentTypes || [],
        minAmount: rule.condition.minAmount,
        maxAmount: rule.condition.maxAmount,
        absenceDays: rule.condition.absenceDays,
        targetType: rule.target.type,
        targetEmployeeId: rule.target.employeeId,
        targetRole: rule.target.role,
        priority: rule.priority,
        validFrom: rule.validFrom,
        validTo: rule.validTo,
      });
      setSelectedDelegator({
        id: rule.delegatorId,
        name: rule.delegatorName,
        departmentName: rule.delegatorDepartment || '',
      });
      if (rule.target.employeeId && rule.target.employeeName) {
        setSelectedTarget({
          id: rule.target.employeeId,
          name: rule.target.employeeName,
          departmentName: '',
        });
      }
    }
  }, [isEditMode, existingRule, reset]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      reset({
        name: '',
        description: '',
        delegatorId: '',
        conditionType: 'ALWAYS',
        documentTypes: [],
        priority: 10,
        targetType: 'DEPARTMENT_HEAD',
      });
      setSelectedDelegator(null);
      setSelectedTarget(null);
      setDelegatorSearch('');
      setTargetSearch('');
    }
  }, [open, reset]);

  const handleDelegatorSelect = useCallback(
    (employee: { id: string; name: string; departmentName: string }) => {
      setSelectedDelegator(employee);
      setValue('delegatorId', employee.id);
      setDelegatorSearch('');
    },
    [setValue]
  );

  const handleTargetSelect = useCallback(
    (employee: { id: string; name: string; departmentName: string }) => {
      setSelectedTarget(employee);
      setValue('targetEmployeeId', employee.id);
      setTargetSearch('');
    },
    [setValue]
  );

  const onSubmit = async (data: DelegationRuleFormData) => {
    try {
      const request: CreateDelegationRuleRequest = {
        name: data.name,
        description: data.description,
        delegatorId: data.delegatorId,
        condition: {
          type: data.conditionType,
          ...(data.conditionType === 'DOCUMENT_TYPE' && {
            documentTypes: data.documentTypes as ApprovalType[],
          }),
          ...(data.conditionType === 'AMOUNT_RANGE' && {
            minAmount: data.minAmount,
            maxAmount: data.maxAmount,
          }),
          ...(data.conditionType === 'ABSENCE' && {
            absenceDays: data.absenceDays,
          }),
        },
        target: {
          type: data.targetType,
          ...(data.targetType === 'SPECIFIC' && {
            employeeId: data.targetEmployeeId,
            employeeName: selectedTarget?.name,
          }),
          ...(data.targetType === 'ROLE' && {
            role: data.targetRole,
          }),
        },
        priority: data.priority,
        validFrom: data.validFrom || undefined,
        validTo: data.validTo || undefined,
      };

      if (isEditMode && editingRuleId) {
        await updateMutation.mutateAsync({
          id: editingRuleId,
          data: request as UpdateDelegationRuleRequest,
        });
        toast({
          title: '수정 완료',
          description: '위임전결 규칙이 수정되었습니다.',
        });
      } else {
        await createMutation.mutateAsync(request);
        toast({
          title: '등록 완료',
          description: '위임전결 규칙이 등록되었습니다.',
        });
      }
      onOpenChange(false);
    } catch {
      toast({
        title: isEditMode ? '수정 실패' : '등록 실패',
        description: '규칙 저장 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (isEditMode && isLoadingRule) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? '위임전결 규칙 수정' : '위임전결 규칙 추가'}
          </DialogTitle>
          <DialogDescription>
            결재 위임 및 전결 규칙을 설정합니다.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">기본 정보</h4>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">규칙명 *</Label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="예: 휴가신청 팀장 전결"
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">우선순위 *</Label>
                <Input
                  id="priority"
                  type="number"
                  {...register('priority', { valueAsNumber: true })}
                  placeholder="1~999 (낮을수록 우선)"
                />
                {errors.priority && (
                  <p className="text-sm text-destructive">{errors.priority.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">설명</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="규칙에 대한 설명을 입력하세요"
                rows={2}
              />
            </div>
          </div>

          {/* Delegator */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">위임자 설정</h4>

            <div className="space-y-2">
              <Label>위임자 (결재권자) *</Label>
              {selectedDelegator ? (
                <div className="flex items-center justify-between p-3 border rounded-md">
                  <div>
                    <p className="font-medium">{selectedDelegator.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedDelegator.departmentName}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedDelegator(null);
                      setValue('delegatorId', '');
                    }}
                  >
                    변경
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Input
                    placeholder="이름으로 검색..."
                    value={delegatorSearch}
                    onChange={(e) => setDelegatorSearch(e.target.value)}
                  />
                  {delegatorSearch.length >= 2 &&
                    delegatorResults?.data &&
                    delegatorResults.data.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-48 overflow-auto">
                        {delegatorResults.data.map((employee) => (
                          <button
                            key={employee.id}
                            type="button"
                            onClick={() => handleDelegatorSelect(employee)}
                            className="w-full text-left px-3 py-2 hover:bg-muted"
                          >
                            <p className="font-medium">{employee.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {employee.departmentName}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                </div>
              )}
              {errors.delegatorId && (
                <p className="text-sm text-destructive">{errors.delegatorId.message}</p>
              )}
            </div>
          </div>

          {/* Condition */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">적용 조건</h4>

            <div className="space-y-2">
              <Label>조건 유형</Label>
              <Controller
                name="conditionType"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="조건 유형 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {(
                        Object.entries(DELEGATION_RULE_CONDITION_LABELS) as [
                          DelegationRuleConditionType,
                          string
                        ][]
                      ).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Document Type Condition */}
            {conditionType === 'DOCUMENT_TYPE' && (
              <div className="space-y-2">
                <Label>적용 문서 유형</Label>
                <Controller
                  name="documentTypes"
                  control={control}
                  render={({ field }) => (
                    <div className="grid grid-cols-2 gap-2">
                      {(
                        Object.entries(APPROVAL_TYPE_LABELS) as [ApprovalType, string][]
                      ).map(([value, label]) => (
                        <label
                          key={value}
                          className="flex items-center gap-2 p-2 border rounded-md cursor-pointer hover:bg-muted"
                        >
                          <Checkbox
                            checked={field.value?.includes(value)}
                            onCheckedChange={(checked) => {
                              const newValue = checked
                                ? [...(field.value || []), value]
                                : (field.value || []).filter((v) => v !== value);
                              field.onChange(newValue);
                            }}
                          />
                          <span className="text-sm">{label}</span>
                        </label>
                      ))}
                    </div>
                  )}
                />
              </div>
            )}

            {/* Amount Range Condition */}
            {conditionType === 'AMOUNT_RANGE' && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="minAmount">최소 금액</Label>
                  <Input
                    id="minAmount"
                    type="number"
                    {...register('minAmount', { valueAsNumber: true })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxAmount">최대 금액</Label>
                  <Input
                    id="maxAmount"
                    type="number"
                    {...register('maxAmount', { valueAsNumber: true })}
                    placeholder="1000000"
                  />
                </div>
              </div>
            )}

            {/* Absence Condition */}
            {conditionType === 'ABSENCE' && (
              <div className="space-y-2">
                <Label htmlFor="absenceDays">부재 일수 (이상)</Label>
                <Input
                  id="absenceDays"
                  type="number"
                  {...register('absenceDays', { valueAsNumber: true })}
                  placeholder="1"
                />
                <p className="text-xs text-muted-foreground">
                  지정된 일수 이상 부재 시 자동으로 위임됩니다.
                </p>
              </div>
            )}
          </div>

          {/* Target */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">위임 대상</h4>

            <div className="space-y-2">
              <Label>대상 유형</Label>
              <Controller
                name="targetType"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="대상 유형 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {(
                        Object.entries(DELEGATION_RULE_TARGET_LABELS) as [
                          DelegationRuleTargetType,
                          string
                        ][]
                      ).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Specific Employee Target */}
            {targetType === 'SPECIFIC' && (
              <div className="space-y-2">
                <Label>대상 직원</Label>
                {selectedTarget ? (
                  <div className="flex items-center justify-between p-3 border rounded-md">
                    <div>
                      <p className="font-medium">{selectedTarget.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedTarget.departmentName}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedTarget(null);
                        setValue('targetEmployeeId', '');
                      }}
                    >
                      변경
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    <Input
                      placeholder="이름으로 검색..."
                      value={targetSearch}
                      onChange={(e) => setTargetSearch(e.target.value)}
                    />
                    {targetSearch.length >= 2 &&
                      targetResults?.data &&
                      targetResults.data.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-48 overflow-auto">
                          {targetResults.data.map((employee) => (
                            <button
                              key={employee.id}
                              type="button"
                              onClick={() => handleTargetSelect(employee)}
                              className="w-full text-left px-3 py-2 hover:bg-muted"
                            >
                              <p className="font-medium">{employee.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {employee.departmentName}
                              </p>
                            </button>
                          ))}
                        </div>
                      )}
                  </div>
                )}
              </div>
            )}

            {/* Role Target */}
            {targetType === 'ROLE' && (
              <div className="space-y-2">
                <Label>역할</Label>
                <Controller
                  name="targetRole"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="역할 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TEAM_LEADER">팀장</SelectItem>
                        <SelectItem value="DEPT_MANAGER">부서장</SelectItem>
                        <SelectItem value="HR_MANAGER">HR 담당자</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            )}
          </div>

          {/* Validity Period */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">유효기간 (선택)</h4>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="validFrom">시작일</Label>
                <Input id="validFrom" type="date" {...register('validFrom')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="validTo">종료일</Label>
                <Input id="validTo" type="date" {...register('validTo')} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              유효기간을 설정하지 않으면 무기한으로 적용됩니다.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              취소
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  저장 중...
                </>
              ) : isEditMode ? (
                '수정'
              ) : (
                '등록'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
