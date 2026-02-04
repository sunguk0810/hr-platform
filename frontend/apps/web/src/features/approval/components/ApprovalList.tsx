import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { ApprovalStatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { Checkbox } from '@/components/ui/checkbox';
import { FileCheck, AlertCircle } from 'lucide-react';
import type { ApprovalListItem, ApprovalType } from '@hr-platform/shared-types';

export interface ApprovalListProps {
  approvals: ApprovalListItem[];
  onItemClick?: (id: string) => void;
  enableSelection?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  emptyMessage?: string;
  className?: string;
}

const APPROVAL_TYPE_LABELS: Record<ApprovalType, string> = {
  LEAVE_REQUEST: '휴가신청',
  EXPENSE: '경비청구',
  OVERTIME: '초과근무',
  PERSONNEL: '인사관련',
  GENERAL: '일반기안',
};

export function ApprovalList({
  approvals,
  onItemClick,
  enableSelection = false,
  selectedIds = new Set(),
  onSelectionChange,
  emptyMessage = '결재 문서가 없습니다.',
  className,
}: ApprovalListProps) {
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange?.(new Set(approvals.map((a) => a.id)));
    } else {
      onSelectionChange?.(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    onSelectionChange?.(newSet);
  };

  const isAllSelected = approvals.length > 0 && approvals.every((a) => selectedIds.has(a.id));

  if (approvals.length === 0) {
    return (
      <EmptyState
        icon={FileCheck}
        title={emptyMessage}
        description="해당 조건의 문서가 없습니다."
      />
    );
  }

  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/50">
            {enableSelection && (
              <th className="px-4 py-3 text-left">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                />
              </th>
            )}
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
              문서번호
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
              유형
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
              제목
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
              기안자
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
              현재 결재자
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
              상태
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
              기안일
            </th>
          </tr>
        </thead>
        <tbody>
          {approvals.map((approval) => (
            <tr
              key={approval.id}
              onClick={() => onItemClick?.(approval.id)}
              className={cn(
                'border-b transition-colors hover:bg-muted/50',
                onItemClick && 'cursor-pointer',
                selectedIds.has(approval.id) && 'bg-muted/30'
              )}
            >
              {enableSelection && (
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedIds.has(approval.id)}
                    onCheckedChange={(checked) =>
                      handleSelectOne(approval.id, checked as boolean)
                    }
                  />
                </td>
              )}
              <td className="px-4 py-3 font-mono text-sm">
                {approval.documentNumber}
              </td>
              <td className="px-4 py-3 text-sm">
                <div className="flex items-center gap-2">
                  {APPROVAL_TYPE_LABELS[approval.type]}
                  {approval.urgency === 'HIGH' && (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-sm font-medium max-w-[300px] truncate">
                {approval.title}
              </td>
              <td className="px-4 py-3 text-sm">
                <div>
                  <div>{approval.requesterName}</div>
                  <div className="text-xs text-muted-foreground">
                    {approval.requesterDepartment}
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground">
                {approval.currentStepName || '-'}
              </td>
              <td className="px-4 py-3">
                <ApprovalStatusBadge status={approval.status} />
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground">
                {format(new Date(approval.createdAt), 'M/d', { locale: ko })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
