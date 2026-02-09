import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/common/PageHeader';
import { ApprovalStatusBadge } from '@/components/common/StatusBadge';
import { PullToRefreshContainer } from '@/components/mobile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Check,
  X,
  Loader2,
  AlertCircle,
  Undo2,
  UserCheck,
  FastForward,
  History,
  FileText,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Paperclip,
  CheckCircle2,
  Clock,
  Link2,
  Pencil,
} from 'lucide-react';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { queryKeys } from '@/lib/queryClient';
import { ApprovalLine } from '../components/ApprovalLine';
import { ApprovalHistory } from '../components/ApprovalHistory';
import { RelatedDocuments } from '../components/RelatedDocuments';
import { RecallDialog } from '../components/RecallDialog';
import { DelegateDialog } from '../components/DelegateDialog';
import { DirectApproveDialog } from '../components/DirectApproveDialog';
import { ModifyApprovalLineDialog } from '../components/ModifyApprovalLineDialog';
import {
  useApproval,
  useApprove,
  useReject,
  useCancel,
  useRecall,
  useDelegate,
  useDirectApprove,
  useApprovalHistory,
} from '../hooks/useApprovals';
import { useAuthStore } from '@/stores/authStore';

const APPROVAL_TYPE_KEYS: Record<string, string> = {
  LEAVE_REQUEST: 'type.leaveRequest',
  EXPENSE: 'type.expense',
  OVERTIME: 'type.overtime',
  PERSONNEL: 'type.personnel',
  GENERAL: 'type.general',
};

const STEP_STATUS_KEYS: Record<string, string> = {
  APPROVED: 'approvalStepIndicator.approved',
  REJECTED: 'approvalStepIndicator.rejected',
  WAITING: 'approvalStepIndicator.waiting',
  SKIPPED: 'approvalStepIndicator.skipped',
};

export default function ApprovalDetailPage() {
  const { t } = useTranslation('approval');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const { user } = useAuthStore();
  const currentUserId = user?.employeeId || '';

  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isRecallDialogOpen, setIsRecallDialogOpen] = useState(false);
  const [isDelegateDialogOpen, setIsDelegateDialogOpen] = useState(false);
  const [isDirectApproveDialogOpen, setIsDirectApproveDialogOpen] = useState(false);
  const [modifyLineOpen, setModifyLineOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [activeTab, setActiveTab] = useState('document');
  const [isContentExpanded, setIsContentExpanded] = useState(false);
  const [showMobileActions, setShowMobileActions] = useState(false);

  const { data, isLoading, isError } = useApproval(id || '');
  const { data: historyData, isLoading: isHistoryLoading } = useApprovalHistory(id || '');
  const approveMutation = useApprove();
  const rejectMutation = useReject();
  const cancelMutation = useCancel();
  const recallMutation = useRecall();
  const delegateMutation = useDelegate();
  const directApproveMutation = useDirectApprove();

  const approval = data?.data;
  const history = historyData?.data;

  const handleApprove = async () => {
    if (!id) return;
    try {
      await approveMutation.mutateAsync({ id, data: { comment: comment || undefined } });
      setIsApproveDialogOpen(false);
      setComment('');
    } catch (error) {
      console.error('Approve failed:', error);
    }
  };

  const handleReject = async () => {
    if (!id || !comment) return;
    try {
      await rejectMutation.mutateAsync({ id, data: { comment } });
      setIsRejectDialogOpen(false);
      setComment('');
    } catch (error) {
      console.error('Reject failed:', error);
    }
  };

  const handleCancel = async () => {
    if (!id) return;
    try {
      await cancelMutation.mutateAsync(id);
      setIsCancelDialogOpen(false);
      navigate('/approvals');
    } catch (error) {
      console.error('Cancel failed:', error);
    }
  };

  const handleRecall = async (reason: string) => {
    if (!id) return;
    try {
      await recallMutation.mutateAsync({ id, data: { reason } });
      setIsRecallDialogOpen(false);
    } catch (error) {
      console.error('Recall failed:', error);
    }
  };

  const handleDelegate = async (delegateToId: string, delegateToName: string, reason?: string) => {
    if (!id || !approval) return;
    const currentStep = approval.approvalLines.find((s) => s.status === 'WAITING');
    if (!currentStep) return;

    try {
      await delegateMutation.mutateAsync({
        id,
        stepId: currentStep.id,
        data: { delegateToId, delegateToName, reason },
      });
      setIsDelegateDialogOpen(false);
    } catch (error) {
      console.error('Delegate failed:', error);
    }
  };

  const handleDirectApprove = async (skipToStep: number | undefined, reason: string) => {
    if (!id) return;
    try {
      await directApproveMutation.mutateAsync({
        id,
        data: { skipToStep, reason },
      });
      setIsDirectApproveDialogOpen(false);
    } catch (error) {
      console.error('Direct approve failed:', error);
    }
  };

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.approvals.detail(id || '') });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !approval) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">{t('approvalDetailPage.notFound')}</p>
        <Button variant="outline" onClick={() => navigate('/approvals')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('common.backToList')}
        </Button>
      </div>
    );
  }

  // 권한 체크
  const isRequester = approval.drafterId === currentUserId;
  const currentStep = approval.approvalLines.find((s) => s.status === 'WAITING');
  const isCurrentApprover = currentStep?.approverId === currentUserId;
  const currentStepOrder = currentStep?.sequence || 1;

  // 버튼 표시 조건
  const canApproveOrReject = approval.status === 'PENDING' && isCurrentApprover;
  const canCancel = ['DRAFT', 'PENDING'].includes(approval.status) && isRequester;
  const canRecall = approval.status === 'PENDING' && isRequester;
  const canDelegate = approval.status === 'PENDING' && isCurrentApprover;
  const canDirectApprove = approval.status === 'PENDING' && isCurrentApprover; // 실제로는 권한 체크 필요
  const canModifyLine = ['PENDING', 'IN_REVIEW'].includes(approval.status) && isRequester;

  const getStepStatusLabel = (status: string) => {
    return t(STEP_STATUS_KEYS[status] || 'approvalStepIndicator.waiting');
  };

  // Dialogs render function (shared between mobile and desktop)
  const renderDialogs = () => (
    <>
      {/* Approve Dialog */}
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('approvalActions.approveTitle')}</DialogTitle>
            <DialogDescription>{t('approvalActions.approveDocConfirm')}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>{t('approvalActions.commentOptionalShort')}</Label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t('approvalActions.commentPlaceholder')}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleApprove} disabled={approveMutation.isPending}>
              {approveMutation.isPending ? t('common.processing') : t('common.approve')}
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
              {t('approvalActions.rejectDocConfirm')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>{t('approvalActions.rejectReasonLabel')}</Label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t('approvalActions.rejectReasonPlaceholder')}
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
              disabled={!comment || rejectMutation.isPending}
            >
              {rejectMutation.isPending ? t('common.processing') : t('common.reject')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('approvalDetailPage.cancelApproval')}</DialogTitle>
            <DialogDescription>
              {t('approvalDetailPage.cancelConfirm')}
              <br />
              <span className="text-destructive">{t('approvalDetailPage.cancelIrreversible')}</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCancelDialogOpen(false)}>
              {t('common.close')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? t('common.processing') : t('approvalDetailPage.cancelConfirmButton')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Recall Dialog */}
      <RecallDialog
        open={isRecallDialogOpen}
        onOpenChange={setIsRecallDialogOpen}
        onConfirm={handleRecall}
        isLoading={recallMutation.isPending}
        documentTitle={approval.title}
      />

      {/* Delegate Dialog */}
      <DelegateDialog
        open={isDelegateDialogOpen}
        onOpenChange={setIsDelegateDialogOpen}
        onConfirm={handleDelegate}
        isLoading={delegateMutation.isPending}
        currentApproverName={currentStep?.approverName}
      />

      {/* Direct Approve Dialog */}
      <DirectApproveDialog
        open={isDirectApproveDialogOpen}
        onOpenChange={setIsDirectApproveDialogOpen}
        onConfirm={handleDirectApprove}
        isLoading={directApproveMutation.isPending}
        steps={approval.approvalLines}
        currentStepOrder={currentStepOrder}
      />

      {/* Modify Approval Line Dialog (FR-APR-003-04) */}
      <ModifyApprovalLineDialog
        open={modifyLineOpen}
        onOpenChange={setModifyLineOpen}
        approvalId={approval.id}
        steps={approval.approvalLines}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: queryKeys.approvals.detail(id || '') });
        }}
      />
    </>
  );

  // Mobile Layout
  if (isMobile) {
    return (
      <PullToRefreshContainer onRefresh={handleRefresh}>
        <div className="space-y-4 pb-32">
          {/* Mobile Header */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 rounded-full hover:bg-muted"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{t(APPROVAL_TYPE_KEYS[approval.documentType])}</span>
                <ApprovalStatusBadge status={approval.status} />
                {approval.urgency === 'HIGH' && (
                  <span className="text-xs text-red-500 flex items-center gap-0.5">
                    <AlertCircle className="h-3 w-3" />
                    {t('urgency.high')}
                  </span>
                )}
              </div>
              <h1 className="text-lg font-bold truncate">{approval.title}</h1>
              <p className="text-xs text-muted-foreground font-mono">{approval.documentNumber}</p>
            </div>
          </div>

          {/* Document Info Card */}
          <div className="bg-card rounded-2xl border p-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">{t('approvalDetailPage.drafter')}</p>
                <p className="font-medium">{approval.drafterName}</p>
                <p className="text-xs text-muted-foreground">{approval.drafterDepartmentName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('approvalDetailPage.draftDate')}</p>
                <p className="font-medium">{format(new Date(approval.createdAt), 'M월 d일', { locale: ko })}</p>
                <p className="text-xs text-muted-foreground">{format(new Date(approval.createdAt), 'HH:mm')}</p>
              </div>
              {approval.dueDate && (
                <div>
                  <p className="text-xs text-muted-foreground">{t('approvalDetailPage.dueDate')}</p>
                  <p className="font-medium">{format(new Date(approval.dueDate), 'M월 d일', { locale: ko })}</p>
                </div>
              )}
              {approval.completedAt && (
                <div>
                  <p className="text-xs text-muted-foreground">{t('approvalDetailPage.completedDate')}</p>
                  <p className="font-medium text-green-600">{format(new Date(approval.completedAt), 'M월 d일', { locale: ko })}</p>
                </div>
              )}
            </div>
          </div>

          {/* Recall Reason Alert */}
          {approval.recallReason && (
            <div className="bg-orange-50 dark:bg-orange-950 rounded-xl border border-orange-200 dark:border-orange-800 p-3">
              <div className="flex items-center gap-2 text-orange-700 dark:text-orange-300 mb-1">
                <Undo2 className="h-4 w-4" />
                <span className="text-sm font-medium">{t('approvalDetailPage.recallReason')}</span>
              </div>
              <p className="text-sm text-orange-800 dark:text-orange-200">{approval.recallReason}</p>
            </div>
          )}

          {/* Approval Line (Horizontal Scroll) */}
          <div className="bg-card rounded-2xl border p-4">
            <h3 className="text-sm font-semibold mb-3">{t('approvalDetailPage.approvalLine')}</h3>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
              {/* Requester */}
              <div className="flex-shrink-0 text-center">
                <div className="w-12 h-12 mx-auto rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-sm font-semibold text-blue-700 dark:text-blue-300">
                  {approval.drafterName.slice(0, 1)}
                </div>
                <p className="text-xs font-medium mt-1">{approval.drafterName}</p>
                <p className="text-[10px] text-muted-foreground">{t('approvalLine.requester')}</p>
              </div>
              {/* Arrow */}
              <div className="flex-shrink-0 flex items-center text-muted-foreground">→</div>
              {/* Approvers */}
              {approval.approvalLines.map((step, idx) => (
                <div key={step.id} className="flex items-center gap-2">
                  <div className="flex-shrink-0 text-center">
                    <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center text-sm font-semibold ${
                      step.status === 'APPROVED' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' :
                      step.status === 'REJECTED' ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300' :
                      step.status === 'WAITING' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {step.status === 'APPROVED' ? <Check className="h-5 w-5" /> :
                       step.status === 'REJECTED' ? <X className="h-5 w-5" /> :
                       step.approverName?.slice(0, 1) || '?'}
                    </div>
                    <p className="text-xs font-medium mt-1">{step.approverName}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {getStepStatusLabel(step.status)}
                    </p>
                  </div>
                  {idx < approval.approvalLines.length - 1 && (
                    <span className="flex-shrink-0 text-muted-foreground">→</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Document Content (Collapsible) */}
          <div className="bg-card rounded-2xl border overflow-hidden">
            <button
              onClick={() => setIsContentExpanded(!isContentExpanded)}
              className="w-full flex items-center justify-between p-4 text-left"
            >
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold text-sm">{t('approvalDetailPage.documentContent')}</span>
              </div>
              {isContentExpanded ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
            {isContentExpanded && (
              <div className="px-4 pb-4 border-t">
                <div className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">
                  {approval.content}
                </div>
                {/* Attachments */}
                {approval.attachments && approval.attachments.length > 0 && (
                  <div className="mt-4 pt-3 border-t">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                      <Paperclip className="h-3 w-3" />
                      {t('approvalDetailPage.attachmentCount', { count: approval.attachments.length })}
                    </div>
                    <div className="space-y-2">
                      {approval.attachments.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-muted/50 text-xs"
                        >
                          <span className="truncate">{file.fileName}</span>
                          <span className="text-muted-foreground flex-shrink-0 ml-2">
                            {(file.fileSize / 1024).toFixed(1)} KB
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Recent History */}
          <div className="bg-card rounded-2xl border p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold text-sm">{t('approvalDetailPage.approvalHistory')}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3 text-sm">
                <div className="w-14 flex-shrink-0 text-xs text-muted-foreground">
                  {format(new Date(approval.createdAt), 'M/d HH:mm')}
                </div>
                <div className="flex-1">
                  <span className="font-medium">{approval.drafterName}</span>
                  <span className="text-muted-foreground"> {t('approvalDetailPage.drafted')}</span>
                </div>
              </div>
              {approval.approvalLines
                .filter((step) => step.completedAt)
                .slice(0, 5)
                .map((step) => (
                  <div key={step.id} className="flex items-start gap-3 text-sm">
                    <div className="w-14 flex-shrink-0 text-xs text-muted-foreground">
                      {format(new Date(step.completedAt!), 'M/d HH:mm')}
                    </div>
                    <div className="flex-1">
                      <span className="font-medium">{step.approverName}</span>
                      <span className={
                        step.status === 'APPROVED' ? 'text-green-600' :
                        step.status === 'REJECTED' ? 'text-red-600' :
                        'text-muted-foreground'
                      }>
                        {' '}
                        {getStepStatusLabel(step.status)}
                      </span>
                      {step.delegateName && (
                        <span className="text-xs text-indigo-600 ml-1">{t('approvalDetailPage.delegateTag')}</span>
                      )}
                      {step.comment && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">"{step.comment}"</p>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Related Documents (FR-APR-001-04) */}
          <RelatedDocuments
            approvalId={approval.id}
            isEditable={approval.status === 'PENDING' && isRequester}
          />

          {/* Mobile Bottom Actions */}
          {(canApproveOrReject || canCancel || canRecall || canDelegate || canDirectApprove || canModifyLine) && (
            <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 pb-safe z-50">
              {/* More Actions Sheet Toggle */}
              {(canRecall || canCancel || canDelegate || canDirectApprove || canModifyLine) && (
                <button
                  onClick={() => setShowMobileActions(!showMobileActions)}
                  className="w-full flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground mb-2"
                >
                  <MoreHorizontal className="h-4 w-4" />
                  {showMobileActions ? t('approvalDetailPage.moreActionsClose') : t('approvalDetailPage.moreActions')}
                </button>
              )}

              {/* Additional Actions */}
              {showMobileActions && (
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {canRecall && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsRecallDialogOpen(true)}
                      className="text-orange-600"
                    >
                      <Undo2 className="mr-1 h-4 w-4" />
                      {t('approvalDetailPage.recall')}
                    </Button>
                  )}
                  {canCancel && !canRecall && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsCancelDialogOpen(true)}
                    >
                      {t('approvalDetailPage.cancelAction')}
                    </Button>
                  )}
                  {canDelegate && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsDelegateDialogOpen(true)}
                      className="text-indigo-600"
                    >
                      <UserCheck className="mr-1 h-4 w-4" />
                      {t('approvalDetailPage.delegate')}
                    </Button>
                  )}
                  {canDirectApprove && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsDirectApproveDialogOpen(true)}
                      className="text-teal-600"
                    >
                      <FastForward className="mr-1 h-4 w-4" />
                      {t('approvalDetailPage.directApprove')}
                    </Button>
                  )}
                  {canModifyLine && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setModifyLineOpen(true)}
                      className="text-blue-600"
                    >
                      <Pencil className="mr-1 h-4 w-4" />
                      {t('approvalDetailPage.modifyLine')}
                    </Button>
                  )}
                </div>
              )}

              {/* Primary Actions */}
              {canApproveOrReject && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 h-12 text-destructive hover:text-destructive"
                    onClick={() => setIsRejectDialogOpen(true)}
                  >
                    <X className="mr-2 h-5 w-5" />
                    {t('common.reject')}
                  </Button>
                  <Button
                    className="flex-1 h-12"
                    onClick={() => setIsApproveDialogOpen(true)}
                  >
                    <Check className="mr-2 h-5 w-5" />
                    {t('common.approve')}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {renderDialogs()}
      </PullToRefreshContainer>
    );
  }

  // Desktop Layout
  return (
    <>
      <PageHeader
        title={t('approvalDetailPage.title')}
        description={t('approvalDetailPage.documentNumber', { number: approval.documentNumber })}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate('/approvals')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('common.backToList')}
            </Button>
            {canRecall && (
              <Button
                variant="outline"
                onClick={() => setIsRecallDialogOpen(true)}
                className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
              >
                <Undo2 className="mr-2 h-4 w-4" />
                {t('approvalDetailPage.recall')}
              </Button>
            )}
            {canCancel && !canRecall && (
              <Button variant="outline" onClick={() => setIsCancelDialogOpen(true)}>
                {t('approvalDetailPage.cancelAction')}
              </Button>
            )}
            {canDelegate && (
              <Button
                variant="outline"
                onClick={() => setIsDelegateDialogOpen(true)}
                className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
              >
                <UserCheck className="mr-2 h-4 w-4" />
                {t('approvalDetailPage.delegate')}
              </Button>
            )}
            {canDirectApprove && (
              <Button
                variant="outline"
                onClick={() => setIsDirectApproveDialogOpen(true)}
                className="text-teal-600 hover:text-teal-700 hover:bg-teal-50"
              >
                <FastForward className="mr-2 h-4 w-4" />
                {t('approvalDetailPage.directApprove')}
              </Button>
            )}
            {canModifyLine && (
              <Button
                variant="outline"
                onClick={() => setModifyLineOpen(true)}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              >
                <Pencil className="mr-2 h-4 w-4" />
                {t('approvalDetailPage.modifyLine')}
              </Button>
            )}
            {canApproveOrReject && (
              <>
                <Button
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setIsRejectDialogOpen(true)}
                >
                  <X className="mr-2 h-4 w-4" />
                  {t('common.reject')}
                </Button>
                <Button onClick={() => setIsApproveDialogOpen(true)}>
                  <Check className="mr-2 h-4 w-4" />
                  {t('common.approve')}
                </Button>
              </>
            )}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="document" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {t('approvalDetailPage.tabDocument')}
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                {t('approvalDetailPage.tabHistory')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="document">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle>{approval.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {t(APPROVAL_TYPE_KEYS[approval.documentType])}
                      {approval.urgency === 'HIGH' && (
                        <span className="ml-2 text-red-500">
                          <AlertCircle className="inline h-4 w-4 mr-1" />
                          {t('urgency.high')}
                        </span>
                      )}
                    </p>
                  </div>
                  <ApprovalStatusBadge status={approval.status} />
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Document Info */}
                    <div className="grid gap-4 md:grid-cols-2 pb-4 border-b">
                      <div>
                        <Label className="text-muted-foreground">{t('approvalDetailPage.drafter')}</Label>
                        <p className="text-sm mt-1">
                          {approval.drafterName} ({approval.drafterDepartmentName})
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">{t('approvalDetailPage.draftDate')}</Label>
                        <p className="text-sm mt-1">
                          {format(new Date(approval.createdAt), 'yyyy년 M월 d일 HH:mm', { locale: ko })}
                        </p>
                      </div>
                      {approval.dueDate && (
                        <div>
                          <Label className="text-muted-foreground">{t('approvalDetailPage.dueDate')}</Label>
                          <p className="text-sm mt-1">
                            {format(new Date(approval.dueDate), 'yyyy년 M월 d일', { locale: ko })}
                          </p>
                        </div>
                      )}
                      {approval.completedAt && (
                        <div>
                          <Label className="text-muted-foreground">{t('approvalDetailPage.completedDate')}</Label>
                          <p className="text-sm mt-1">
                            {format(new Date(approval.completedAt), 'yyyy년 M월 d일 HH:mm', { locale: ko })}
                          </p>
                        </div>
                      )}
                      {approval.recalledAt && (
                        <div>
                          <Label className="text-muted-foreground">{t('approvalDetailPage.recalledDate')}</Label>
                          <p className="text-sm mt-1 text-orange-600">
                            {format(new Date(approval.recalledAt), 'yyyy년 M월 d일 HH:mm', { locale: ko })}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Recall Reason */}
                    {approval.recallReason && (
                      <div className="rounded-lg bg-orange-50 border border-orange-200 p-4">
                        <Label className="text-orange-700 text-sm font-medium">{t('approvalDetailPage.recallReason')}</Label>
                        <p className="text-sm mt-1 text-orange-800">{approval.recallReason}</p>
                      </div>
                    )}

                    {/* Document Content */}
                    <div>
                      <Label className="text-muted-foreground">{t('approvalDetailPage.documentContent')}</Label>
                      <div className="mt-2 p-4 rounded-lg bg-muted/50 whitespace-pre-wrap text-sm">
                        {approval.content}
                      </div>
                    </div>

                    {/* Attachments */}
                    {approval.attachments && approval.attachments.length > 0 && (
                      <div>
                        <Label className="text-muted-foreground">{t('approvalDetailPage.attachments')}</Label>
                        <div className="mt-2 space-y-2">
                          {approval.attachments.map((file) => (
                            <div
                              key={file.id}
                              className="flex items-center justify-between p-2 rounded border"
                            >
                              <span className="text-sm">{file.fileName}</span>
                              <span className="text-xs text-muted-foreground">
                                {(file.fileSize / 1024).toFixed(1)} KB
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history">
              {isHistoryLoading ? (
                <Card>
                  <CardContent className="flex items-center justify-center h-48">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </CardContent>
                </Card>
              ) : (
                <ApprovalHistory historyData={history} />
              )}
            </TabsContent>
          </Tabs>

          {/* Related Documents (FR-APR-001-04) */}
          <div className="mt-6">
            <RelatedDocuments
              approvalId={approval.id}
              isEditable={approval.status === 'PENDING' && isRequester}
            />
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('approvalDetailPage.approvalLine')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ApprovalLine
                steps={approval.approvalLines}
                requesterName={approval.drafterName}
              />
            </CardContent>
          </Card>

          {/* Quick History (간략 이력) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{t('approvalDetailPage.recentHistory')}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveTab('history')}
                  className="text-xs"
                >
                  {t('common.viewAll')}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3 text-sm">
                  <div className="w-20 text-muted-foreground">
                    {format(new Date(approval.createdAt), 'M/d HH:mm')}
                  </div>
                  <div>
                    <span className="font-medium">{approval.drafterName}</span>
                    {t('approvalDetailPage.draftedBy')}
                  </div>
                </div>
                {approval.approvalLines
                  .filter((step) => step.completedAt)
                  .slice(0, 3)
                  .map((step) => (
                    <div key={step.id} className="flex items-start gap-3 text-sm">
                      <div className="w-20 text-muted-foreground">
                        {format(new Date(step.completedAt!), 'M/d HH:mm')}
                      </div>
                      <div>
                        <span className="font-medium">{step.approverName}</span>
                        {t('approvalDetailPage.personActionSuffix')}
                        <span
                          className={
                            step.status === 'APPROVED'
                              ? 'text-green-600'
                              : step.status === 'REJECTED'
                              ? 'text-red-600'
                              : 'text-muted-foreground'
                          }
                        >
                          {getStepStatusLabel(step.status)}
                        </span>
                        {step.delegateName && (
                          <span className="text-xs text-indigo-600 ml-1">
                            {t('approvalDetailPage.delegateWithName', { name: step.delegateName })}
                          </span>
                        )}
                        {step.directApproved && (
                          <span className="text-xs text-teal-600 ml-1">{t('approvalDetailPage.directApproveTag')}</span>
                        )}
                        {step.comment && (
                          <p className="text-muted-foreground mt-1">"{step.comment}"</p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Approval Mode Display */}
          {approval.mode && approval.mode !== 'SEQUENTIAL' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">{t('approvalDetailPage.approvalMode')}</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="outline" className={
                  approval.mode === 'PARALLEL' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                  approval.mode === 'CONSENSUS' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                  approval.mode === 'DIRECT' ? 'bg-teal-50 text-teal-700 border-teal-200' :
                  ''
                }>
                  {approval.mode === 'PARALLEL' ? t('mode.parallel') :
                   approval.mode === 'CONSENSUS' ? t('mode.consensus') :
                   approval.mode === 'DIRECT' ? t('mode.direct') : approval.mode}
                </Badge>
                {approval.mode === 'PARALLEL' && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {t('approvalDetailPage.parallelModeDesc')}
                  </p>
                )}
                {approval.mode === 'CONSENSUS' && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {t('approvalDetailPage.consensusModeDesc')}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Linked Modules Feedback (FR-APR-004-03) */}
          {approval.status === 'APPROVED' && approval.linkedModules && approval.linkedModules.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Link2 className="h-4 w-4" />
                  {t('approvalDetailPage.linkedModules')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {approval.linkedModules.map((linked, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      {linked.status === 'COMPLETED' ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      ) : linked.status === 'FAILED' ? (
                        <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                      ) : (
                        <Clock className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                      )}
                      <div>
                        <p className="font-medium">{linked.module}</p>
                        <p className="text-xs text-muted-foreground">{linked.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {renderDialogs()}
    </>
  );
}
