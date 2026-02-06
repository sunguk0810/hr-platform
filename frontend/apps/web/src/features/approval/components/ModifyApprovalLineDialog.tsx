import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/useToast';
import { User, Plus, Trash2, Search, CheckCircle2, XCircle, Clock } from 'lucide-react';
import type { ApprovalStep, ApprovalStepStatus } from '@hr-platform/shared-types';

const MOCK_APPROVERS = [
  { id: 'user-10', name: '김부장', department: '경영지원팀', position: '부장' },
  { id: 'user-11', name: '이과장', department: '개발팀', position: '과장' },
  { id: 'user-12', name: '박대리', department: '인사팀', position: '대리' },
  { id: 'user-13', name: '최차장', department: '영업팀', position: '차장' },
  { id: 'user-14', name: '정팀장', department: '기획팀', position: '팀장' },
];

interface ModifiedStep {
  id: string;
  stepOrder: number;
  approverId: string;
  approverName: string;
  approverDepartment?: string;
  approverPosition?: string;
  status: ApprovalStepStatus;
  isNew?: boolean;
}

interface ModifyApprovalLineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  approvalId: string;
  steps: ApprovalStep[];
  onSuccess: () => void;
}

function getStatusBadge(status: ApprovalStepStatus) {
  switch (status) {
    case 'APPROVED':
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          승인
        </Badge>
      );
    case 'REJECTED':
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <XCircle className="mr-1 h-3 w-3" />
          반려
        </Badge>
      );
    case 'PENDING':
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <Clock className="mr-1 h-3 w-3" />
          대기
        </Badge>
      );
    case 'SKIPPED':
      return (
        <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200">
          건너뜀
        </Badge>
      );
    default:
      return null;
  }
}

export function ModifyApprovalLineDialog({
  open,
  onOpenChange,
  approvalId,
  steps,
  onSuccess,
}: ModifyApprovalLineDialogProps) {
  const { toast } = useToast();
  const [modifiedSteps, setModifiedSteps] = useState<ModifiedStep[]>([]);
  const [reason, setReason] = useState('');
  const [searchingStepId, setSearchingStepId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Initialize modified steps from props when dialog opens
  const initializeSteps = () => {
    setModifiedSteps(
      steps.map((step) => ({
        id: step.id,
        stepOrder: step.stepOrder,
        approverId: step.approverId || '',
        approverName: step.approverName || '',
        approverDepartment: step.approverDepartment,
        approverPosition: step.approverPosition,
        status: step.status,
      }))
    );
    setReason('');
    setSearchingStepId(null);
    setSearchQuery('');
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      initializeSteps();
    }
    onOpenChange(newOpen);
  };

  const filteredApprovers = useMemo(() => {
    if (!searchQuery.trim()) return MOCK_APPROVERS;
    const query = searchQuery.toLowerCase();
    return MOCK_APPROVERS.filter(
      (a) =>
        a.name.toLowerCase().includes(query) ||
        a.department.toLowerCase().includes(query) ||
        a.position.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const handleChangeApprover = (
    stepId: string,
    approver: (typeof MOCK_APPROVERS)[number]
  ) => {
    setModifiedSteps((prev) =>
      prev.map((s) =>
        s.id === stepId
          ? {
              ...s,
              approverId: approver.id,
              approverName: approver.name,
              approverDepartment: approver.department,
              approverPosition: approver.position,
            }
          : s
      )
    );
    setSearchingStepId(null);
    setSearchQuery('');
  };

  const handleRemoveStep = (stepId: string) => {
    setModifiedSteps((prev) => {
      const filtered = prev.filter((s) => s.id !== stepId);
      // Reorder remaining steps
      return filtered.map((s, idx) => ({
        ...s,
        stepOrder: idx + 1,
      }));
    });
  };

  const handleAddStep = () => {
    const newStep: ModifiedStep = {
      id: `new-step-${Date.now()}`,
      stepOrder: modifiedSteps.length + 1,
      approverId: '',
      approverName: '',
      status: 'PENDING',
      isNew: true,
    };
    setModifiedSteps((prev) => [...prev, newStep]);
    setSearchingStepId(newStep.id);
    setSearchQuery('');
  };

  const pendingStepCount = modifiedSteps.filter((s) => s.status === 'PENDING').length;
  const isReasonValid = reason.trim().length >= 10;
  const hasValidPendingSteps = modifiedSteps
    .filter((s) => s.status === 'PENDING')
    .every((s) => s.approverId);
  const canSave = isReasonValid && hasValidPendingSteps && pendingStepCount > 0;

  const handleSave = async () => {
    if (!canSave) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/v1/approvals/${approvalId}/approval-line`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          steps: modifiedSteps.map((s) => ({
            id: s.isNew ? undefined : s.id,
            stepOrder: s.stepOrder,
            approverId: s.approverId,
            approverName: s.approverName,
            approverDepartment: s.approverDepartment,
            approverPosition: s.approverPosition,
            status: s.status,
          })),
          reason,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: '결재선이 수정되었습니다.',
        });
        onOpenChange(false);
        onSuccess();
      } else {
        toast({
          title: '결재선 수정 실패',
          description: data.error?.message || '알 수 없는 오류가 발생했습니다.',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: '결재선 수정 실패',
        description: '네트워크 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>결재선 수정</DialogTitle>
          <DialogDescription>
            상신된 결재의 결재선을 수정합니다. 이미 승인/반려된 단계는 변경할 수 없습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Steps List */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">결재선</Label>
            {modifiedSteps.map((step) => {
              const isLocked = step.status === 'APPROVED' || step.status === 'REJECTED';
              const isPending = step.status === 'PENDING';
              const isSearchOpen = searchingStepId === step.id;

              return (
                <div
                  key={step.id}
                  className={`rounded-lg border p-3 ${
                    isLocked ? 'bg-muted/50 opacity-75' : 'bg-background'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-semibold">
                        {step.stepOrder}
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">
                            {step.approverName || '(결재자 선택 필요)'}
                          </p>
                          {step.approverDepartment && (
                            <p className="text-xs text-muted-foreground">
                              {step.approverDepartment}
                              {step.approverPosition ? ` / ${step.approverPosition}` : ''}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(step.status)}
                      {isPending && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSearchingStepId(isSearchOpen ? null : step.id);
                              setSearchQuery('');
                            }}
                          >
                            변경
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleRemoveStep(step.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Approver Search Dropdown */}
                  {isSearchOpen && isPending && (
                    <div className="mt-3 border-t pt-3">
                      <div className="relative mb-2">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="이름, 부서, 직위로 검색..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {filteredApprovers.length > 0 ? (
                          filteredApprovers.map((approver) => (
                            <button
                              key={approver.id}
                              className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-muted text-left text-sm"
                              onClick={() => handleChangeApprover(step.id, approver)}
                            >
                              <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <div>
                                <p className="font-medium">{approver.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {approver.department} / {approver.position}
                                </p>
                              </div>
                            </button>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-2">
                            검색 결과가 없습니다.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Add Step Button */}
            <Button
              variant="outline"
              className="w-full"
              onClick={handleAddStep}
            >
              <Plus className="mr-2 h-4 w-4" />
              결재자 추가
            </Button>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="modify-reason" className="text-sm font-semibold">
              수정 사유 <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="modify-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="결재선 수정 사유를 입력하세요. (최소 10자)"
              rows={3}
            />
            {reason.length > 0 && reason.trim().length < 10 && (
              <p className="text-xs text-destructive">
                수정 사유는 최소 10자 이상 입력해주세요. (현재 {reason.trim().length}자)
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handleSave} disabled={!canSave || isSaving}>
            {isSaving ? '저장 중...' : '저장'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
