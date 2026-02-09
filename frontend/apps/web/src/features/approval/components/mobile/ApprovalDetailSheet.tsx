import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { User, Calendar, FileText, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { BottomSheet } from '@/components/mobile';
import { ApprovalStatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import type { ApprovalListItem } from '@hr-platform/shared-types';

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
  const { t } = useTranslation('approval');

  if (!approval) return null;

  const APPROVAL_TYPE_LABELS: Record<string, string> = {
    LEAVE_REQUEST: t('type.leaveRequest'),
    EXPENSE: t('type.expense'),
    OVERTIME: t('type.overtime'),
    PERSONNEL: t('type.personnel'),
    GENERAL: t('type.general'),
  };

  const dateDisplay = format(new Date(approval.createdAt), 'yyyy년 M월 d일 (E)', {
    locale: ko,
  });

  return (
    <BottomSheet open={open} onClose={onClose} title={t('approvalDetailSheet.title')}>
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
              <p className="text-xs text-muted-foreground">{t('approvalDetailSheet.type')}</p>
              <p className="text-sm font-medium">
                {APPROVAL_TYPE_LABELS[approval.documentType]}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <User className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">{t('approvalDetailSheet.drafter')}</p>
              <p className="text-sm font-medium">{approval.drafterName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">{t('approvalDetailSheet.draftDate')}</p>
              <p className="text-sm font-medium">{dateDisplay}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">{t('approvalDetailSheet.currentApprover')}</p>
              <p className="text-sm font-medium">
                {approval.currentStepName || '-'}
              </p>
            </div>
          </div>
        </div>

        {/* Department Info */}
        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">{t('approvalDetailSheet.drafterDepartment')}</p>
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
                {isRejecting ? t('common.processing') : t('common.reject')}
              </Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={onApprove}
                disabled={isApproving || isRejecting}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {isApproving ? t('common.processing') : t('common.approve')}
              </Button>
            </>
          )}
          <Button
            variant={canApprove ? 'ghost' : 'default'}
            className={canApprove ? '' : 'flex-1'}
            onClick={onViewDetail}
          >
            {t('common.viewDetail')}
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
