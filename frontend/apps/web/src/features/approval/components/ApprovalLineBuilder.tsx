import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, GripVertical, User, Users, Building2, GitBranch, GitMerge } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ApproverSelector, type ApproverOption } from './ApproverSelector';

export type ApproverType = 'SPECIFIC' | 'ROLE' | 'DEPARTMENT_HEAD';
export type ApprovalExecutionType = 'SEQUENTIAL' | 'PARALLEL' | 'AGREEMENT';
export type ParallelCompletionCondition = 'ALL' | 'ANY' | 'MAJORITY';

export interface ApprovalLineStep {
  id: string;
  order: number;
  approverType: ApproverType;
  approverId?: string;
  approverName?: string;
  roleName?: string;
  /** Execution type - sequential (default), parallel, or agreement */
  executionType?: ApprovalExecutionType;
  /** Group ID for parallel/agreement steps - steps with same groupId execute together */
  parallelGroupId?: string;
  /** Completion condition for parallel steps */
  parallelCompletionCondition?: ParallelCompletionCondition;
}

export interface ApprovalLineBuilderProps {
  steps: ApprovalLineStep[];
  onChange: (steps: ApprovalLineStep[]) => void;
  maxSteps?: number;
  onSearchApprovers?: (keyword: string) => Promise<ApproverOption[]>;
  className?: string;
}

const completionConditionLabels: Record<ParallelCompletionCondition, string> = {
  ALL: '전원 승인',
  ANY: '1인 승인',
  MAJORITY: '과반수',
};

export function ApprovalLineBuilder({
  steps,
  onChange,
  maxSteps = 10,
  onSearchApprovers,
  className,
}: ApprovalLineBuilderProps) {
  const [draggingId, setDraggingId] = React.useState<string | null>(null);
  const [openSelectId, setOpenSelectId] = React.useState<string | null>(null);

  const generateId = () => Math.random().toString(36).substring(2, 9);
  const generateGroupId = () => `group-${Math.random().toString(36).substring(2, 9)}`;

  const handleAddStep = (executionType: ApprovalExecutionType = 'SEQUENTIAL') => {
    if (steps.length >= maxSteps) return;

    const newStep: ApprovalLineStep = {
      id: generateId(),
      order: steps.length + 1,
      approverType: 'SPECIFIC',
      executionType,
      parallelGroupId: executionType !== 'SEQUENTIAL' ? generateGroupId() : undefined,
      parallelCompletionCondition: executionType !== 'SEQUENTIAL' ? 'ALL' : undefined,
    };
    onChange([...steps, newStep]);
  };

  const handleAddParallelStep = (groupId: string) => {
    if (steps.length >= maxSteps) return;

    const groupSteps = steps.filter((s) => s.parallelGroupId === groupId);
    const firstGroupStep = groupSteps[0];
    if (!firstGroupStep) return;

    const newStep: ApprovalLineStep = {
      id: generateId(),
      order: steps.length + 1,
      approverType: 'SPECIFIC',
      executionType: firstGroupStep.executionType,
      parallelGroupId: groupId,
      parallelCompletionCondition: firstGroupStep.parallelCompletionCondition,
    };

    // Insert after the last step in this group
    const lastGroupStepIndex = steps.findIndex(
      (s) => s.id === groupSteps[groupSteps.length - 1].id
    );
    const newSteps = [...steps];
    newSteps.splice(lastGroupStepIndex + 1, 0, newStep);

    onChange(newSteps.map((step, index) => ({ ...step, order: index + 1 })));
  };

  const handleRemoveStep = (id: string) => {
    const stepToRemove = steps.find((s) => s.id === id);
    let newSteps = steps.filter((step) => step.id !== id);

    // If this was the last step in a parallel group, clean up
    if (stepToRemove?.parallelGroupId) {
      const remainingGroupSteps = newSteps.filter(
        (s) => s.parallelGroupId === stepToRemove.parallelGroupId
      );
      // If only one step remains, convert it to sequential
      if (remainingGroupSteps.length === 1) {
        newSteps = newSteps.map((s) =>
          s.parallelGroupId === stepToRemove.parallelGroupId
            ? { ...s, executionType: 'SEQUENTIAL' as const, parallelGroupId: undefined, parallelCompletionCondition: undefined }
            : s
        );
      }
    }

    onChange(newSteps.map((step, index) => ({ ...step, order: index + 1 })));
  };

  const handleUpdateStep = (id: string, updates: Partial<ApprovalLineStep>) => {
    const newSteps = steps.map((step) =>
      step.id === id ? { ...step, ...updates } : step
    );
    onChange(newSteps);
  };

  const handleUpdateParallelGroup = (
    groupId: string,
    updates: Partial<Pick<ApprovalLineStep, 'parallelCompletionCondition'>>
  ) => {
    const newSteps = steps.map((step) =>
      step.parallelGroupId === groupId ? { ...step, ...updates } : step
    );
    onChange(newSteps);
  };

  const handleTypeChange = (id: string, approverType: ApproverType) => {
    handleUpdateStep(id, {
      approverType,
      approverId: undefined,
      approverName: undefined,
      roleName: undefined,
    });
  };

  const handleSelectApprover = (id: string, approver: ApproverOption) => {
    handleUpdateStep(id, {
      approverId: approver.id,
      approverName: approver.name,
    });
    setOpenSelectId(null);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggingId || draggingId === targetId) return;

    const dragIndex = steps.findIndex((s) => s.id === draggingId);
    const targetIndex = steps.findIndex((s) => s.id === targetId);

    if (dragIndex === -1 || targetIndex === -1) return;

    const newSteps = [...steps];
    const [draggedStep] = newSteps.splice(dragIndex, 1);
    newSteps.splice(targetIndex, 0, draggedStep);

    const reorderedSteps = newSteps.map((step, index) => ({
      ...step,
      order: index + 1,
    }));

    onChange(reorderedSteps);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
  };

  const getTypeIcon = (type: ApproverType) => {
    switch (type) {
      case 'SPECIFIC':
        return <User className="h-4 w-4" />;
      case 'ROLE':
        return <Users className="h-4 w-4" />;
      case 'DEPARTMENT_HEAD':
        return <Building2 className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: ApproverType) => {
    switch (type) {
      case 'SPECIFIC':
        return '특정인';
      case 'ROLE':
        return '역할';
      case 'DEPARTMENT_HEAD':
        return '부서장';
    }
  };

  // Group steps by parallelGroupId for rendering
  const groupedSteps = React.useMemo(() => {
    const groups: { groupId: string | null; steps: ApprovalLineStep[] }[] = [];
    let currentGroup: { groupId: string | null; steps: ApprovalLineStep[] } | null = null;

    steps.forEach((step) => {
      const groupId = step.parallelGroupId || null;

      if (currentGroup && currentGroup.groupId === groupId) {
        currentGroup.steps.push(step);
      } else {
        if (currentGroup) {
          groups.push(currentGroup);
        }
        currentGroup = { groupId, steps: [step] };
      }
    });

    if (currentGroup) {
      groups.push(currentGroup);
    }

    return groups;
  }, [steps]);

  const renderStepCard = (step: ApprovalLineStep, isInParallelGroup: boolean) => (
    <Card
      key={step.id}
      draggable
      onDragStart={(e) => handleDragStart(e, step.id)}
      onDragOver={(e) => handleDragOver(e, step.id)}
      onDragEnd={handleDragEnd}
      className={cn(
        'transition-opacity',
        draggingId === step.id && 'opacity-50',
        isInParallelGroup && 'border-purple-200 bg-purple-50/30'
      )}
    >
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          {/* Drag handle */}
          <div className="cursor-grab text-muted-foreground hover:text-foreground">
            <GripVertical className="h-5 w-5" />
          </div>

          {/* Step number */}
          <div
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium',
              isInParallelGroup
                ? 'bg-purple-500 text-white'
                : 'bg-primary text-primary-foreground'
            )}
          >
            {step.order}
          </div>

          {/* Type selector */}
          <div className="flex gap-1">
            {(['SPECIFIC', 'ROLE', 'DEPARTMENT_HEAD'] as ApproverType[]).map((type) => (
              <Button
                key={type}
                type="button"
                variant={step.approverType === type ? 'default' : 'outline'}
                size="sm"
                className="h-8 px-2"
                onClick={() => handleTypeChange(step.id, type)}
              >
                {getTypeIcon(type)}
                <span className="ml-1 hidden sm:inline">{getTypeLabel(type)}</span>
              </Button>
            ))}
          </div>

          {/* Approver selector */}
          <div className="flex-1">
            {step.approverType === 'SPECIFIC' && (
              <ApproverSelector
                open={openSelectId === step.id}
                onOpenChange={(open) => setOpenSelectId(open ? step.id : null)}
                value={
                  step.approverId
                    ? {
                        id: step.approverId,
                        name: step.approverName || '',
                        departmentName: '',
                      }
                    : undefined
                }
                onSelect={(approver) => handleSelectApprover(step.id, approver)}
                onSearch={onSearchApprovers}
              />
            )}
            {step.approverType === 'ROLE' && (
              <select
                value={step.roleName || ''}
                onChange={(e) =>
                  handleUpdateStep(step.id, {
                    roleName: e.target.value,
                    approverName: e.target.value,
                  })
                }
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">역할 선택</option>
                <option value="TEAM_LEADER">팀장</option>
                <option value="DEPARTMENT_HEAD">부서장</option>
                <option value="HR_MANAGER">인사담당자</option>
                <option value="CFO">재무담당임원</option>
                <option value="CEO">대표이사</option>
              </select>
            )}
            {step.approverType === 'DEPARTMENT_HEAD' && (
              <div className="flex h-9 items-center px-3 text-sm text-muted-foreground">
                기안자의 부서장이 자동 지정됩니다
              </div>
            )}
          </div>

          {/* Remove button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={() => handleRemoveStep(step.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">결재선</h3>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleAddStep('SEQUENTIAL')}
            disabled={steps.length >= maxSteps}
          >
            <Plus className="h-4 w-4 mr-1" />
            결재자 추가
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleAddStep('PARALLEL')}
            disabled={steps.length >= maxSteps}
            className="text-purple-600 border-purple-200 hover:bg-purple-50"
          >
            <GitBranch className="h-4 w-4 mr-1" />
            병렬 결재
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleAddStep('AGREEMENT')}
            disabled={steps.length >= maxSteps}
            className="text-purple-600 border-purple-200 hover:bg-purple-50"
          >
            <GitMerge className="h-4 w-4 mr-1" />
            합의
          </Button>
        </div>
      </div>

      {steps.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">결재자를 추가해주세요</p>
            <p className="text-xs mt-1">
              순차 결재, 병렬 결재(동시 진행), 합의(협의 후 진행) 중 선택할 수 있습니다
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {groupedSteps.map((group) => {
            if (group.groupId) {
              // Parallel group
              const firstStep = group.steps[0];
              return (
                <div
                  key={group.groupId}
                  className="rounded-lg border-2 border-dashed border-purple-300 p-3 bg-purple-50/20"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className="bg-purple-100 text-purple-700"
                      >
                        {firstStep.executionType === 'PARALLEL' ? (
                          <>
                            <GitBranch className="h-3 w-3 mr-1" />
                            병렬 결재
                          </>
                        ) : (
                          <>
                            <GitMerge className="h-3 w-3 mr-1" />
                            합의
                          </>
                        )}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {group.steps.length}명이 동시에 결재
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">완료 조건:</span>
                      <Select
                        value={firstStep.parallelCompletionCondition || 'ALL'}
                        onValueChange={(value) =>
                          handleUpdateParallelGroup(group.groupId!, {
                            parallelCompletionCondition: value as ParallelCompletionCondition,
                          })
                        }
                      >
                        <SelectTrigger className="h-7 w-28 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">{completionConditionLabels.ALL}</SelectItem>
                          <SelectItem value="ANY">{completionConditionLabels.ANY}</SelectItem>
                          <SelectItem value="MAJORITY">
                            {completionConditionLabels.MAJORITY}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {group.steps.map((step) => renderStepCard(step, true))}
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full mt-2 text-purple-600 hover:text-purple-700 hover:bg-purple-100"
                    onClick={() => handleAddParallelStep(group.groupId!)}
                    disabled={steps.length >= maxSteps}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    병렬 결재자 추가
                  </Button>
                </div>
              );
            } else {
              // Sequential steps
              return group.steps.map((step) => renderStepCard(step, false));
            }
          })}
        </div>
      )}

      {steps.length > 0 && steps.length < maxSteps && (
        <p className="text-xs text-muted-foreground text-center">
          최대 {maxSteps}단계까지 추가할 수 있습니다 ({steps.length}/{maxSteps})
        </p>
      )}

      {/* Legend */}
      {steps.some((s) => s.executionType && s.executionType !== 'SEQUENTIAL') && (
        <div className="flex flex-wrap gap-4 pt-2 border-t text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <GitBranch className="h-3 w-3 text-purple-500" />
            <span>병렬 결재: 동시에 결재 진행</span>
          </div>
          <div className="flex items-center gap-1">
            <GitMerge className="h-3 w-3 text-purple-500" />
            <span>합의: 협의 후 결재 진행</span>
          </div>
        </div>
      )}
    </div>
  );
}
