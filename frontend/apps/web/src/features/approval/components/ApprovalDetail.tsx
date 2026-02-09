import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ApprovalStatusBadge } from '@/components/common/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  FileText,
  User,
  Building2,
  Calendar,
  Check,
  X,
  MessageSquare,
  Paperclip,
  Loader2,
} from 'lucide-react';
import type { Approval, ApprovalLine } from '@hr-platform/shared-types';

export interface ApprovalDetailProps {
  approval: Approval;
  canApprove?: boolean;
  canReject?: boolean;
  onApprove?: (comment: string) => Promise<void>;
  onReject?: (comment: string) => Promise<void>;
  onDownloadAttachment?: (attachmentId: string) => void;
  isLoading?: boolean;
}

export function ApprovalDetail({
  approval,
  canApprove = false,
  canReject = false,
  onApprove,
  onReject,
  onDownloadAttachment,
  isLoading = false,
}: ApprovalDetailProps) {
  const { t } = useTranslation('approval');
  const [isApproveDialogOpen, setIsApproveDialogOpen] = React.useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = React.useState(false);
  const [comment, setComment] = React.useState('');

  const APPROVAL_TYPE_LABELS: Record<string, string> = {
    LEAVE_REQUEST: t('type.leaveRequest'),
    EXPENSE: t('type.expense'),
    OVERTIME: t('type.overtime'),
    PERSONNEL: t('type.personnel'),
    GENERAL: t('type.general'),
  };

  const handleApprove = async () => {
    await onApprove?.(comment);
    setIsApproveDialogOpen(false);
    setComment('');
  };

  const handleReject = async () => {
    await onReject?.(comment);
    setIsRejectDialogOpen(false);
    setComment('');
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground font-mono">
                  {approval.documentNumber}
                </span>
                <ApprovalStatusBadge status={approval.status} />
              </div>
              <CardTitle className="text-xl">{approval.title}</CardTitle>
            </div>
            {(canApprove || canReject) && (
              <div className="flex gap-2">
                {canReject && (
                  <Button
                    variant="outline"
                    onClick={() => setIsRejectDialogOpen(true)}
                    disabled={isLoading}
                  >
                    <X className="mr-2 h-4 w-4" />
                    {t('common.reject')}
                  </Button>
                )}
                {canApprove && (
                  <Button
                    onClick={() => setIsApproveDialogOpen(true)}
                    disabled={isLoading}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    {t('common.approve')}
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('approvalDetail.documentType')}</p>
                <p className="font-medium">{APPROVAL_TYPE_LABELS[approval.documentType]}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                <User className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('approvalDetail.drafter')}</p>
                <p className="font-medium">{approval.drafterName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                <Building2 className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('approvalDetail.department')}</p>
                <p className="font-medium">{approval.drafterDepartmentName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                <Calendar className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('approvalDetail.draftDate')}</p>
                <p className="font-medium">
                  {format(new Date(approval.createdAt), 'yyyy.M.d', { locale: ko })}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Approval Line */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('approvalDetail.approvalLine')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 overflow-x-auto py-2">
            {approval.approvalLines.map((step, index) => (
              <React.Fragment key={step.id}>
                {index > 0 && (
                  <div className="flex-shrink-0 w-8 h-px bg-border" />
                )}
                <ApprovalLineCard step={step} />
              </React.Fragment>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('approvalDetail.documentContent')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="prose prose-sm max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: approval.content }}
          />
        </CardContent>
      </Card>

      {/* Attachments */}
      {approval.attachments && approval.attachments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Paperclip className="h-4 w-4" />
              {t('approvalDetail.attachmentCount', { count: approval.attachments.length })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {approval.attachments.map((attachment) => (
                <li key={attachment.id}>
                  <button
                    type="button"
                    onClick={() => onDownloadAttachment?.(attachment.id)}
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <Paperclip className="h-4 w-4" />
                    {attachment.fileName}
                    <span className="text-muted-foreground">
                      ({(attachment.fileSize / 1024).toFixed(1)} KB)
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Approve Dialog */}
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('approvalActions.approveTitle')}</DialogTitle>
            <DialogDescription>
              {t('approvalActions.approveDocConfirm')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="approve-comment">{t('approvalActions.commentOptionalShort')}</Label>
              <Textarea
                id="approve-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t('approvalActions.commentPlaceholderNoEnd')}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleApprove} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('common.processing')}
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  {t('common.approve')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('approvalActions.rejectTitle')}</DialogTitle>
            <DialogDescription>
              {t('approvalActions.rejectDocConfirmShort')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reject-comment">{t('approvalActions.rejectReasonLabel')}</Label>
              <Textarea
                id="reject-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t('approvalActions.rejectReasonPlaceholderNoEnd')}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isLoading || !comment.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('common.processing')}
                </>
              ) : (
                <>
                  <X className="mr-2 h-4 w-4" />
                  {t('common.reject')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface ApprovalLineCardProps {
  step: ApprovalLine;
}

function ApprovalLineCard({ step }: ApprovalLineCardProps) {
  const { t } = useTranslation('approval');

  const statusConfig = {
    WAITING: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-500', label: t('approvalDetail.statusWaiting') },
    ACTIVE: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600', label: t('approvalDetail.statusActive') },
    APPROVED: { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-600', label: t('approvalDetail.statusApproved') },
    REJECTED: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600', label: t('approvalDetail.statusRejected') },
    AGREED: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600', label: t('approvalDetail.statusAgreed') },
    SKIPPED: { bg: 'bg-gray-50 dark:bg-gray-800', text: 'text-gray-400', label: t('approvalDetail.statusSkipped') },
  };

  const config = statusConfig[step.status];

  return (
    <div className={`flex-shrink-0 p-3 rounded-lg ${config.bg} min-w-[140px]`}>
      <div className="flex items-center gap-2 mb-2">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs">
            {step.approverName?.slice(0, 2) || '?'}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{step.approverName || t('approvalDetail.unassigned')}</p>
          <p className="text-xs text-muted-foreground">
            {t('approvalDetail.step', { n: step.sequence })}
          </p>
        </div>
      </div>
      <div className={`text-xs font-medium ${config.text}`}>
        {config.label}
        {step.completedAt && (
          <span className="block text-muted-foreground font-normal mt-1">
            {format(new Date(step.completedAt), 'M/d HH:mm')}
          </span>
        )}
      </div>
      {step.comment && (
        <div className="mt-2 flex items-start gap-1">
          <MessageSquare className="h-3 w-3 text-muted-foreground mt-0.5" />
          <p className="text-xs text-muted-foreground line-clamp-2">{step.comment}</p>
        </div>
      )}
    </div>
  );
}
