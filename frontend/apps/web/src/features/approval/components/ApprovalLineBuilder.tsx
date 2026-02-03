import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, GripVertical, User, Users, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ApproverSelector, type ApproverOption } from './ApproverSelector';

export type ApproverType = 'SPECIFIC' | 'ROLE' | 'DEPARTMENT_HEAD';

export interface ApprovalLineStep {
  id: string;
  order: number;
  approverType: ApproverType;
  approverId?: string;
  approverName?: string;
  roleName?: string;
}

export interface ApprovalLineBuilderProps {
  steps: ApprovalLineStep[];
  onChange: (steps: ApprovalLineStep[]) => void;
  maxSteps?: number;
  onSearchApprovers?: (keyword: string) => Promise<ApproverOption[]>;
  className?: string;
}

export function ApprovalLineBuilder({
  steps,
  onChange,
  maxSteps = 5,
  onSearchApprovers,
  className,
}: ApprovalLineBuilderProps) {
  const [draggingId, setDraggingId] = React.useState<string | null>(null);
  const [openSelectId, setOpenSelectId] = React.useState<string | null>(null);

  const generateId = () => Math.random().toString(36).substring(2, 9);

  const handleAddStep = () => {
    if (steps.length >= maxSteps) return;

    const newStep: ApprovalLineStep = {
      id: generateId(),
      order: steps.length + 1,
      approverType: 'SPECIFIC',
    };
    onChange([...steps, newStep]);
  };

  const handleRemoveStep = (id: string) => {
    const newSteps = steps
      .filter((step) => step.id !== id)
      .map((step, index) => ({ ...step, order: index + 1 }));
    onChange(newSteps);
  };

  const handleUpdateStep = (id: string, updates: Partial<ApprovalLineStep>) => {
    const newSteps = steps.map((step) =>
      step.id === id ? { ...step, ...updates } : step
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

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">결재선</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddStep}
          disabled={steps.length >= maxSteps}
        >
          <Plus className="h-4 w-4 mr-1" />
          결재자 추가
        </Button>
      </div>

      {steps.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">결재자를 추가해주세요</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {steps.map((step) => (
            <Card
              key={step.id}
              draggable
              onDragStart={(e) => handleDragStart(e, step.id)}
              onDragOver={(e) => handleDragOver(e, step.id)}
              onDragEnd={handleDragEnd}
              className={cn(
                'transition-opacity',
                draggingId === step.id && 'opacity-50'
              )}
            >
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  {/* Drag handle */}
                  <div className="cursor-grab text-muted-foreground hover:text-foreground">
                    <GripVertical className="h-5 w-5" />
                  </div>

                  {/* Step number */}
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    {step.order}
                  </div>

                  {/* Type selector */}
                  <div className="flex gap-1">
                    {(['SPECIFIC', 'ROLE', 'DEPARTMENT_HEAD'] as ApproverType[]).map(
                      (type) => (
                        <Button
                          key={type}
                          type="button"
                          variant={step.approverType === type ? 'default' : 'outline'}
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => handleTypeChange(step.id, type)}
                        >
                          {getTypeIcon(type)}
                          <span className="ml-1 hidden sm:inline">
                            {getTypeLabel(type)}
                          </span>
                        </Button>
                      )
                    )}
                  </div>

                  {/* Approver selector */}
                  <div className="flex-1">
                    {step.approverType === 'SPECIFIC' && (
                      <ApproverSelector
                        open={openSelectId === step.id}
                        onOpenChange={(open) =>
                          setOpenSelectId(open ? step.id : null)
                        }
                        value={
                          step.approverId
                            ? {
                                id: step.approverId,
                                name: step.approverName || '',
                                departmentName: '',
                              }
                            : undefined
                        }
                        onSelect={(approver) =>
                          handleSelectApprover(step.id, approver)
                        }
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
          ))}
        </div>
      )}

      {steps.length > 0 && steps.length < maxSteps && (
        <p className="text-xs text-muted-foreground text-center">
          최대 {maxSteps}단계까지 추가할 수 있습니다 ({steps.length}/{maxSteps})
        </p>
      )}
    </div>
  );
}
