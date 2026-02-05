import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { AlertCircle, User, Clock, ChevronRight, Check, X } from 'lucide-react';
import { MobileCard, MobileCardContent, SwipeableCard } from '@/components/mobile';
import { ApprovalStatusBadge } from '@/components/common/StatusBadge';
import { cn } from '@/lib/utils';
import type { ApprovalListItem, ApprovalType } from '@hr-platform/shared-types';

const APPROVAL_TYPE_LABELS: Record<ApprovalType, string> = {
  LEAVE_REQUEST: '휴가신청',
  EXPENSE: '경비청구',
  OVERTIME: '초과근무',
  PERSONNEL: '인사관련',
  GENERAL: '일반기안',
};

const TYPE_COLORS: Record<ApprovalType, string> = {
  LEAVE_REQUEST: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  EXPENSE: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  OVERTIME: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  PERSONNEL: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  GENERAL: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

interface ApprovalCardProps {
  approval: ApprovalListItem;
  onClick?: () => void;
  /** 스와이프로 승인 (결재 대기 상태일 때만 동작) */
  onSwipeApprove?: () => void;
  /** 스와이프로 반려 (결재 대기 상태일 때만 동작) */
  onSwipeReject?: () => void;
  /** 스와이프 액션 활성화 여부 (기본값: false) */
  enableSwipeActions?: boolean;
}

export function ApprovalCard({
  approval,
  onClick,
  onSwipeApprove,
  onSwipeReject,
  enableSwipeActions = false,
}: ApprovalCardProps) {
  const dateDisplay = format(new Date(approval.createdAt), 'M월 d일 (E)', { locale: ko });
  const canSwipe = enableSwipeActions && approval.status === 'PENDING';

  const cardContent = (
    <MobileCard onClick={onClick} className={canSwipe ? '' : 'mb-3'}>
      <MobileCardContent>
        {/* Header: Type Badge + Status + Urgent */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'px-2 py-0.5 text-xs font-medium rounded-full',
                TYPE_COLORS[approval.type]
              )}
            >
              {APPROVAL_TYPE_LABELS[approval.type]}
            </span>
            {approval.urgency === 'HIGH' && (
              <span className="flex items-center gap-0.5 text-xs text-red-500 font-medium">
                <AlertCircle className="h-3.5 w-3.5" />
                긴급
              </span>
            )}
          </div>
          <ApprovalStatusBadge status={approval.status} />
        </div>

        {/* Title */}
        <h3 className="font-medium text-foreground mb-2 line-clamp-2">
          {approval.title}
        </h3>

        {/* Document Number */}
        <p className="text-xs text-muted-foreground font-mono mb-3">
          {approval.documentNumber}
        </p>

        {/* Footer: Requester + Date */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <User className="h-4 w-4" />
            <span>{approval.requesterName}</span>
            <span className="text-xs">({approval.requesterDepartment})</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            <span className="text-xs">{dateDisplay}</span>
          </div>
        </div>

        {/* Current Approver */}
        {approval.currentStepName && (
          <div className="mt-2 pt-2 border-t border-border text-xs text-muted-foreground">
            현재 결재자: <span className="font-medium">{approval.currentStepName}</span>
          </div>
        )}

        {/* Arrow indicator */}
        {onClick && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <ChevronRight className="h-5 w-5 text-muted-foreground/50" />
          </div>
        )}

        {/* Swipe hint for pending items */}
        {canSwipe && (
          <div className="mt-2 pt-2 border-t border-border text-xs text-muted-foreground text-center">
            ← 반려 | 승인 →
          </div>
        )}
      </MobileCardContent>
    </MobileCard>
  );

  // Wrap with SwipeableCard if swipe actions are enabled
  if (canSwipe && (onSwipeApprove || onSwipeReject)) {
    return (
      <SwipeableCard
        className="mb-3"
        leftActions={
          onSwipeApprove
            ? [
                {
                  icon: <Check className="h-5 w-5" />,
                  label: '승인',
                  color: 'success',
                  onAction: onSwipeApprove,
                },
              ]
            : []
        }
        rightActions={
          onSwipeReject
            ? [
                {
                  icon: <X className="h-5 w-5" />,
                  label: '반려',
                  color: 'destructive',
                  onAction: onSwipeReject,
                },
              ]
            : []
        }
      >
        {cardContent}
      </SwipeableCard>
    );
  }

  return cardContent;
}
