import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { User, Calendar, FileText, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { BottomSheet } from '@/components/mobile';
import { ApprovalStatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import type { ApprovalListItem } from '@hr-platform/shared-types';

const APPROVAL_TYPE_LABELS: Record<string, string> = {
  LEAVE_REQUEST: '휴가신청',
  EXPENSE: '경비청구',
  OVERTIME: '초과근무',
  PERSONNEL: '인사관련',
  GENERAL: '일반기안',
};

interface ApprovalDetailSheetProps {
  open: boolean;
  onClose: () => void;
  approval: ApprovalListItem | null;
  onApprove?: () => void;
  onReject?: () => void;
  onViewDetail?: () => void;
  canApprove?: boolean;
  isApproving?: boolean;
  isRejecting?: boolean;
}

export function ApprovalDetailSheet({
  open,
  onClose,
  approval,
  onApprove,
  onReject,
  onViewDetail,
  canApprove = false,
  isApproving = false,
  isRejecting = false,
}: ApprovalDetailSheetProps) {
  if (!approval) return null;

  const dateDisplay = format(new Date(approval.createdAt), 'yyyy년 M월 d일 (E)', {
    locale: ko,
  });

  return (
    <BottomSheet open={open} onClose={onClose} title="결재 문서">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs text-muted-foreground font-mono">
              {approval.documentNumber}
            </span>
            <h2 className="text-lg font-semibold mt-1">{approval.title}</h2>
          </div>
          <ApprovalStatusBadge status={approval.status} />
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">유형</p>
              <p className="text-sm font-medium">
                {APPROVAL_TYPE_LABELS[approval.documentType]}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <User className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">기안자</p>
              <p className="text-sm font-medium">{approval.drafterName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">기안일</p>
              <p className="text-sm font-medium">{dateDisplay}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">현재 결재자</p>
              <p className="text-sm font-medium">
                {approval.currentStepName || '-'}
              </p>
            </div>
          </div>
        </div>

        {/* Department Info */}
        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">기안 부서</p>
          <p className="text-sm">{approval.drafterDepartmentName}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4">
          {canApprove && approval.status === 'PENDING' && (
            <>
              <Button
                variant="outline"
                className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                onClick={onReject}
                disabled={isRejecting || isApproving}
              >
                <XCircle className="mr-2 h-4 w-4" />
                {isRejecting ? '처리 중...' : '반려'}
              </Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={onApprove}
                disabled={isApproving || isRejecting}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {isApproving ? '처리 중...' : '승인'}
              </Button>
            </>
          )}
          <Button
            variant={canApprove ? 'ghost' : 'default'}
            className={canApprove ? '' : 'flex-1'}
            onClick={onViewDetail}
          >
            상세 보기
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
