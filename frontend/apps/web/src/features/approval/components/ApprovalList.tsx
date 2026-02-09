import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { ApprovalStatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { Checkbox } from '@/components/ui/checkbox';
import { FileCheck, AlertCircle } from 'lucide-react';
import type { ApprovalListItem } from '@hr-platform/shared-types';

export interface ApprovalListProps {
  approvals: ApprovalListItem[];
  onItemClick?: (id: string) => void;
  enableSelection?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  emptyMessage?: string;
  className?: string;
}

export function ApprovalList({
  approvals,
  onItemClick,
  enableSelection = false,
  selectedIds = new Set(),
  onSelectionChange,
  emptyMessage,
  className,
}: ApprovalListProps) {
  const { t } = useTranslation('approval');

  const APPROVAL_TYPE_LABELS: Record<string, string> = {
    LEAVE_REQUEST: t('type.leaveRequest'),
    EXPENSE: t('type.expense'),
    OVERTIME: t('type.overtime'),
    PERSONNEL: t('type.personnel'),
    GENERAL: t('type.general'),
  };

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
        title={emptyMessage || t('approvalList.empty')}
        description={t('approvalList.emptyDesc')}
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
              {t('approvalList.tableDocNumber')}
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
              {t('approvalList.tableType')}
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
              {t('approvalList.tableTitle')}
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
              {t('approvalList.tableDrafter')}
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
              {t('approvalList.tableCurrentApprover')}
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
              {t('approvalList.tableStatus')}
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
              {t('approvalList.tableCreatedDate')}
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
                  {APPROVAL_TYPE_LABELS[approval.documentType]}
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
                  <div>{approval.drafterName}</div>
                  <div className="text-xs text-muted-foreground">
                    {approval.drafterDepartmentName}
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
