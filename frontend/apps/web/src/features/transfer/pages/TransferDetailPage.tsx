import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { PageHeader } from '@/components/common/PageHeader';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { PullToRefreshContainer } from '@/components/mobile';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ArrowLeftRight,
  ArrowRight,
  ArrowLeft as ArrowLeftIcon,
  RefreshCw,
  Check,
  X,
  Loader2,
  Building2,
  User,
  FileText,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useIsMobile } from '@/hooks/useMediaQuery';
import {
  useTransfer,
  useApproveSource,
  useApproveTarget,
  useRejectTransfer,
  useCompleteTransfer,
  useCancelTransfer,
  useHandoverItems,
  useCompleteHandoverItem,
} from '../hooks/useTransfer';
import type { TransferStatus, TransferType } from '@hr-platform/shared-types';
import { TRANSFER_STATUS_LABELS, TRANSFER_TYPE_LABELS } from '@hr-platform/shared-types';
import { cn } from '@/lib/utils';

const STATUS_COLORS: Record<TransferStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  PENDING_SOURCE: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  PENDING_TARGET: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  APPROVED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  CANCELLED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

const TYPE_ICONS: Record<TransferType, React.ReactNode> = {
  TRANSFER_OUT: <ArrowRight className="h-5 w-5" aria-hidden="true" />,
  TRANSFER_IN: <ArrowLeftIcon className="h-5 w-5" aria-hidden="true" />,
  SECONDMENT: <RefreshCw className="h-5 w-5" aria-hidden="true" />,
};

export default function TransferDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const { t } = useTranslation('transfer');

  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [rejectComment, setRejectComment] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [expandedSection, setExpandedSection] = useState<string | null>('info');

  const { data: transferData, isLoading } = useTransfer(id || '');
  const { data: handoverData } = useHandoverItems(id || '');

  const approveSourceMutation = useApproveSource();
  const approveTargetMutation = useApproveTarget();
  const rejectMutation = useRejectTransfer();
  const completeMutation = useCompleteTransfer();
  const cancelMutation = useCancelTransfer();
  const completeHandoverMutation = useCompleteHandoverItem();

  const transfer = transferData?.data;
  const handoverItems = handoverData?.data ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" aria-hidden="true" />
        <span className="sr-only">{t('loading')}</span>
      </div>
    );
  }

  if (!transfer) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{t('notFound.title')}</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/transfer')}>
          {t('notFound.goToList')}
        </Button>
      </div>
    );
  }

  const handleApproveSource = async () => {
    try {
      await approveSourceMutation.mutateAsync({ id: transfer.id });
      toast({
        title: t('toast.outboundApproveSuccess'),
        description: t('toast.outboundApproveSuccessDesc'),
      });
    } catch {
      toast({
        title: t('toast.approveFailed'),
        description: t('toast.processFailed'),
        variant: 'destructive',
      });
    }
  };

  const handleApproveTarget = async () => {
    try {
      await approveTargetMutation.mutateAsync({ id: transfer.id });
      toast({
        title: t('toast.inboundApproveSuccess'),
        description: t('toast.inboundApproveSuccessDesc'),
      });
    } catch {
      toast({
        title: t('toast.approveFailed'),
        description: t('toast.processFailed'),
        variant: 'destructive',
      });
    }
  };

  const handleReject = async () => {
    if (!rejectComment.trim()) {
      toast({
        title: t('toast.rejectReasonRequired'),
        description: t('toast.rejectReasonRequiredDesc'),
        variant: 'destructive',
      });
      return;
    }

    try {
      await rejectMutation.mutateAsync({ id: transfer.id, data: { comment: rejectComment } });
      toast({
        title: t('toast.rejectSuccess'),
        description: t('toast.rejectSuccessDesc'),
      });
      setIsRejectDialogOpen(false);
      setRejectComment('');
    } catch {
      toast({
        title: t('toast.rejectFailed'),
        description: t('toast.processFailed'),
        variant: 'destructive',
      });
    }
  };

  const handleComplete = async () => {
    try {
      await completeMutation.mutateAsync(transfer.id);
      toast({
        title: t('toast.completeSuccess'),
        description: t('toast.completeSuccessDesc'),
      });
    } catch {
      toast({
        title: t('toast.completeFailed'),
        description: t('toast.processFailed'),
        variant: 'destructive',
      });
    }
  };

  const handleCancel = async () => {
    try {
      await cancelMutation.mutateAsync({ id: transfer.id, reason: cancelReason });
      toast({
        title: t('toast.cancelSuccess'),
        description: t('toast.cancelSuccessDesc'),
      });
      setIsCancelDialogOpen(false);
      setCancelReason('');
    } catch {
      toast({
        title: t('toast.cancelFailed'),
        description: t('toast.processFailed'),
        variant: 'destructive',
      });
    }
  };

  const handleCompleteHandoverItem = async (itemId: string) => {
    try {
      await completeHandoverMutation.mutateAsync({ transferId: transfer.id, itemId });
    } catch {
      toast({
        title: t('toast.handoverFailed'),
        description: t('toast.handoverFailedDesc'),
        variant: 'destructive',
      });
    }
  };

  const canApproveSource = transfer.status === 'PENDING_SOURCE';
  const canApproveTarget = transfer.status === 'PENDING_TARGET';
  const canComplete = transfer.status === 'APPROVED';
  const canCancel = ['DRAFT', 'PENDING_SOURCE', 'PENDING_TARGET'].includes(transfer.status);

  const isPending =
    approveSourceMutation.isPending ||
    approveTargetMutation.isPending ||
    rejectMutation.isPending ||
    completeMutation.isPending ||
    cancelMutation.isPending;

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['transfer', id] });
    await queryClient.invalidateQueries({ queryKey: ['handover-items', id] });
  };

  // Shared Dialogs
  const renderDialogs = () => (
    <>
      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('rejectDialog.title')}</DialogTitle>
            <DialogDescription>{t('rejectDialog.description')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              placeholder={t('rejectDialog.placeholder')}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
              {t('rejectDialog.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={rejectMutation.isPending}>
              {rejectMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
              {t('rejectDialog.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <ConfirmDialog
        open={isCancelDialogOpen}
        onOpenChange={setIsCancelDialogOpen}
        title={t('cancelDialog.title')}
        description={t('cancelDialog.description')}
        confirmLabel={t('cancelDialog.confirm')}
        variant="destructive"
        isLoading={cancelMutation.isPending}
        onConfirm={handleCancel}
      />
    </>
  );

  const MobileSection = ({
    id: sectionId,
    title,
    icon: Icon,
    children
  }: {
    id: string;
    title: string;
    icon: React.ElementType;
    children: React.ReactNode
  }) => {
    const isExpanded = expandedSection === sectionId;
    return (
      <div className="bg-card rounded-xl border overflow-hidden">
        <button
          onClick={() => setExpandedSection(isExpanded ? null : sectionId)}
          className="w-full flex items-center justify-between p-4"
        >
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4" />
            <span className="font-medium text-sm">{title}</span>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        {isExpanded && <div className="px-4 pb-4 space-y-3">{children}</div>}
      </div>
    );
  };

  // Mobile Layout
  if (isMobile) {
    return (
      <PullToRefreshContainer onRefresh={handleRefresh}>
        <div className="space-y-4 pb-24">
          {/* Mobile Header */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/transfer')}
              className="p-2 -ml-2 rounded-full hover:bg-muted"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold truncate">{transfer.requestNumber}</h1>
              <p className="text-sm text-muted-foreground">{t('detail.title')}</p>
            </div>
            <Badge className={cn(STATUS_COLORS[transfer.status])}>
              {TRANSFER_STATUS_LABELS[transfer.status]}
            </Badge>
          </div>

          {/* Transfer Flow Visual */}
          <div className="bg-card rounded-xl border p-4">
            <div className="flex items-center justify-center gap-2">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">{t('detail.outbound')}</p>
                <p className="font-medium text-sm">{transfer.sourceTenantName}</p>
              </div>
              <ArrowRight className="h-5 w-5 text-primary flex-shrink-0" />
              <div className="text-center">
                <p className="text-xs text-muted-foreground">{t('detail.inbound')}</p>
                <p className="font-medium text-sm">{transfer.targetTenantName}</p>
              </div>
            </div>
            <div className="flex justify-center mt-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {TYPE_ICONS[transfer.type]}
                <span>{TRANSFER_TYPE_LABELS[transfer.type]}</span>
              </div>
            </div>
          </div>

          {/* Collapsible Sections */}
          <div className="space-y-3">
            <MobileSection id="info" title={t('requestInfo.title')} icon={ArrowLeftRight}>
              <InfoRow label={t('requestInfo.requestNumber')} value={transfer.requestNumber} mono />
              {transfer.requestedDate && <InfoRow label={t('requestInfo.requestDate')} value={format(new Date(transfer.requestedDate), 'yyyy-MM-dd', { locale: ko })} />}
              <InfoRow label={t('requestInfo.effectiveDate')} value={format(new Date(transfer.transferDate), 'yyyy-MM-dd', { locale: ko })} highlight />
              {transfer.returnDate && (
                <InfoRow label={t('requestInfo.returnDate')} value={format(new Date(transfer.returnDate!), 'yyyy-MM-dd', { locale: ko })} />
              )}
            </MobileSection>

            <MobileSection id="employee" title={t('employeeInfo.title')} icon={User}>
              <InfoRow label={t('employeeInfo.name')} value={transfer.employeeName} highlight />
              <InfoRow label={t('employeeInfo.employeeNumber')} value={transfer.employeeNumber} mono />
              {transfer.sourceDepartmentName && (
                <InfoRow label={t('employeeInfo.currentDepartment')} value={transfer.sourceDepartmentName} />
              )}
              {transfer.sourcePositionName && (
                <InfoRow label={t('employeeInfo.currentPosition')} value={transfer.sourcePositionName} />
              )}
              {transfer.sourceGradeName && (
                <InfoRow label={t('employeeInfo.currentGrade')} value={transfer.sourceGradeName} />
              )}
            </MobileSection>

            <MobileSection id="source" title={t('outboundTenant.title')} icon={Building2}>
              <InfoRow label={t('outboundTenant.tenant')} value={transfer.sourceTenantName} highlight />
              {transfer.sourceDepartmentName && (
                <InfoRow label={t('outboundTenant.department')} value={transfer.sourceDepartmentName} />
              )}
              {transfer.sourceApprovedAt && (
                <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-xs font-medium text-green-600">{t('outboundTenant.approved')}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {transfer.sourceApproverName} · {format(new Date(transfer.sourceApprovedAt), 'M/d HH:mm', { locale: ko })}
                  </p>
                </div>
              )}
            </MobileSection>

            <MobileSection id="target" title={t('inboundTenant.title')} icon={Building2}>
              <InfoRow label={t('inboundTenant.tenant')} value={transfer.targetTenantName} highlight />
              {transfer.targetDepartmentName && (
                <InfoRow label={t('inboundTenant.department')} value={transfer.targetDepartmentName} />
              )}
              {transfer.targetPositionName && (
                <InfoRow label={t('inboundTenant.position')} value={transfer.targetPositionName} />
              )}
              {transfer.targetGradeName && (
                <InfoRow label={t('inboundTenant.grade')} value={transfer.targetGradeName} />
              )}
              {transfer.targetApprovedAt && (
                <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-xs font-medium text-green-600">{t('inboundTenant.approved')}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {transfer.targetApproverName} · {format(new Date(transfer.targetApprovedAt), 'M/d HH:mm', { locale: ko })}
                  </p>
                </div>
              )}
            </MobileSection>

            <MobileSection id="reason" title={t('reason.title')} icon={FileText}>
              <p className="text-sm whitespace-pre-wrap">{transfer.reason}</p>
              {transfer.handoverItems && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-muted-foreground mb-1">{t('reason.handover')}</p>
                  <p className="text-sm whitespace-pre-wrap">{transfer.handoverItems}</p>
                </div>
              )}
              {transfer.remarks && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-muted-foreground mb-1">{t('reason.remarks')}</p>
                  <p className="text-sm whitespace-pre-wrap">{transfer.remarks}</p>
                </div>
              )}
            </MobileSection>

            {handoverItems.length > 0 && (
              <MobileSection id="handover" title={t('handover.count', { completed: handoverItems.filter(i => i.isCompleted).length, total: handoverItems.length })} icon={CheckCircle2}>
                <div className="space-y-2">
                  {handoverItems.map((item) => (
                    <div key={item.id} className="flex items-start gap-3 p-2 border rounded-lg">
                      <input
                        type="checkbox"
                        checked={item.isCompleted}
                        onChange={() => !item.isCompleted && handleCompleteHandoverItem(item.id)}
                        disabled={item.isCompleted || completeHandoverMutation.isPending}
                        className="h-4 w-4 mt-0.5"
                      />
                      <div className="flex-1">
                        <p className={cn('text-sm', item.isCompleted && 'line-through text-muted-foreground')}>
                          {item.title}
                        </p>
                        {item.description && (
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </MobileSection>
            )}
          </div>

          {/* Fixed Bottom Actions */}
          {(canApproveSource || canApproveTarget || canComplete || canCancel) && (
            <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 pb-safe z-50">
              <div className="flex gap-2">
                {canCancel && (
                  <Button
                    variant="outline"
                    onClick={() => setIsCancelDialogOpen(true)}
                    disabled={isPending}
                    className="flex-1"
                  >
                    {t('actions.cancelRequest')}
                  </Button>
                )}
                {(canApproveSource || canApproveTarget) && (
                  <Button
                    variant="outline"
                    onClick={() => setIsRejectDialogOpen(true)}
                    disabled={isPending}
                    className="flex-1"
                  >
                    <X className="mr-1 h-4 w-4" />
                    {t('actions.reject')}
                  </Button>
                )}
                {canApproveSource && (
                  <Button onClick={handleApproveSource} disabled={isPending} className="flex-1">
                    {approveSourceMutation.isPending ? (
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="mr-1 h-4 w-4" />
                    )}
                    {t('actions.approveOutbound')}
                  </Button>
                )}
                {canApproveTarget && (
                  <Button onClick={handleApproveTarget} disabled={isPending} className="flex-1">
                    {approveTargetMutation.isPending ? (
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="mr-1 h-4 w-4" />
                    )}
                    {t('actions.approveInbound')}
                  </Button>
                )}
                {canComplete && (
                  <Button onClick={handleComplete} disabled={isPending} className="flex-1">
                    {completeMutation.isPending ? (
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="mr-1 h-4 w-4" />
                    )}
                    {t('actions.complete')}
                  </Button>
                )}
              </div>
            </div>
          )}

          {renderDialogs()}
        </div>
      </PullToRefreshContainer>
    );
  }

  // Helper component for mobile info rows
  function InfoRow({ label, value, mono, highlight }: { label: string; value: string; mono?: boolean; highlight?: boolean }) {
    return (
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className={cn('text-sm', mono && 'font-mono', highlight && 'font-medium')}>{value}</span>
      </div>
    );
  }

  // Desktop Layout
  return (
    <>
      <PageHeader
        title={t('detail.titleWithNumber', { number: transfer.requestNumber })}
        description={t('detail.description')}
        actions={
          <div className="flex gap-2">
            {canApproveSource && (
              <>
                <Button variant="outline" onClick={() => setIsRejectDialogOpen(true)} disabled={isPending}>
                  <X className="mr-2 h-4 w-4" aria-hidden="true" />
                  {t('actions.reject')}
                </Button>
                <Button onClick={handleApproveSource} disabled={isPending}>
                  {approveSourceMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Check className="mr-2 h-4 w-4" aria-hidden="true" />
                  )}
                  {t('actions.approveOutbound')}
                </Button>
              </>
            )}
            {canApproveTarget && (
              <>
                <Button variant="outline" onClick={() => setIsRejectDialogOpen(true)} disabled={isPending}>
                  <X className="mr-2 h-4 w-4" aria-hidden="true" />
                  {t('actions.reject')}
                </Button>
                <Button onClick={handleApproveTarget} disabled={isPending}>
                  {approveTargetMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Check className="mr-2 h-4 w-4" aria-hidden="true" />
                  )}
                  {t('actions.approveInbound')}
                </Button>
              </>
            )}
            {canComplete && (
              <Button onClick={handleComplete} disabled={isPending}>
                {completeMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <CheckCircle2 className="mr-2 h-4 w-4" aria-hidden="true" />
                )}
                {t('actions.complete')}
              </Button>
            )}
            {canCancel && (
              <Button variant="destructive" onClick={() => setIsCancelDialogOpen(true)} disabled={isPending}>
                {t('actions.cancelRequest')}
              </Button>
            )}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Status & Type */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5" aria-hidden="true" />
              {t('requestInfo.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t('requestInfo.requestNumber')}</span>
              <span className="font-mono">{transfer.requestNumber}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t('requestInfo.type')}</span>
              <div className="flex items-center gap-2">
                {TYPE_ICONS[transfer.type]}
                <span>{TRANSFER_TYPE_LABELS[transfer.type]}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t('requestInfo.status')}</span>
              <Badge className={cn(STATUS_COLORS[transfer.status])} role="status">
                {TRANSFER_STATUS_LABELS[transfer.status]}
              </Badge>
            </div>
            {transfer.requestedDate && <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t('requestInfo.requestDate')}</span>
              <span>{format(new Date(transfer.requestedDate), 'yyyy-MM-dd', { locale: ko })}</span>
            </div>}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t('requestInfo.effectiveDate')}</span>
              <span className="font-medium">{format(new Date(transfer.transferDate), 'yyyy-MM-dd', { locale: ko })}</span>
            </div>
            {transfer.returnDate && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('requestInfo.returnDate')}</span>
                <span>{format(new Date(transfer.returnDate), 'yyyy-MM-dd', { locale: ko })}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Employee Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" aria-hidden="true" />
              {t('employeeInfo.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t('employeeInfo.name')}</span>
              <span className="font-medium">{transfer.employeeName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t('employeeInfo.employeeNumber')}</span>
              <span className="font-mono">{transfer.employeeNumber}</span>
            </div>
            {transfer.sourceDepartmentName && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('employeeInfo.currentDepartment')}</span>
                <span>{transfer.sourceDepartmentName}</span>
              </div>
            )}
            {transfer.sourcePositionName && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('employeeInfo.currentPosition')}</span>
                <span>{transfer.sourcePositionName}</span>
              </div>
            )}
            {transfer.sourceGradeName && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('employeeInfo.currentGrade')}</span>
                <span>{transfer.sourceGradeName}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Source Tenant */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" aria-hidden="true" />
              {t('outboundTenant.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t('outboundTenant.tenant')}</span>
              <span className="font-medium">{transfer.sourceTenantName}</span>
            </div>
            {transfer.sourceDepartmentName && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('outboundTenant.department')}</span>
                <span>{transfer.sourceDepartmentName}</span>
              </div>
            )}
            {transfer.sourceApprovedAt && (
              <>
                <div className="border-t pt-4 mt-4">
                  <p className="text-sm font-medium text-green-600">{t('outboundTenant.approved')}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {transfer.sourceApproverName} |{' '}
                    {format(new Date(transfer.sourceApprovedAt), 'yyyy-MM-dd HH:mm', { locale: ko })}
                  </p>
                  {transfer.sourceComment && (
                    <p className="text-sm mt-2">{transfer.sourceComment}</p>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Target Tenant */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" aria-hidden="true" />
              {t('inboundTenant.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t('inboundTenant.tenant')}</span>
              <span className="font-medium">{transfer.targetTenantName}</span>
            </div>
            {transfer.targetDepartmentName && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('inboundTenant.department')}</span>
                <span>{transfer.targetDepartmentName}</span>
              </div>
            )}
            {transfer.targetPositionName && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('inboundTenant.position')}</span>
                <span>{transfer.targetPositionName}</span>
              </div>
            )}
            {transfer.targetGradeName && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('inboundTenant.grade')}</span>
                <span>{transfer.targetGradeName}</span>
              </div>
            )}
            {transfer.targetApprovedAt && (
              <>
                <div className="border-t pt-4 mt-4">
                  <p className="text-sm font-medium text-green-600">{t('inboundTenant.approved')}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {transfer.targetApproverName} |{' '}
                    {format(new Date(transfer.targetApprovedAt), 'yyyy-MM-dd HH:mm', { locale: ko })}
                  </p>
                  {transfer.targetComment && (
                    <p className="text-sm mt-2">{transfer.targetComment}</p>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Reason */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" aria-hidden="true" />
              {t('reason.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-muted-foreground">{t('reason.label')}</Label>
              <p className="mt-1 whitespace-pre-wrap">{transfer.reason}</p>
            </div>
            {transfer.handoverItems && (
              <div>
                <Label className="text-muted-foreground">{t('reason.handover')}</Label>
                <p className="mt-1 whitespace-pre-wrap">{transfer.handoverItems}</p>
              </div>
            )}
            {transfer.remarks && (
              <div>
                <Label className="text-muted-foreground">{t('reason.remarks')}</Label>
                <p className="mt-1 whitespace-pre-wrap">{transfer.remarks}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Handover Checklist */}
        {handoverItems.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                {t('handover.title')}
              </CardTitle>
              <CardDescription>
                {t('handover.progress', { completed: handoverItems.filter((i) => i.isCompleted).length, total: handoverItems.length })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {handoverItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 border rounded-md"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={item.isCompleted}
                        onChange={() => !item.isCompleted && handleCompleteHandoverItem(item.id)}
                        disabled={item.isCompleted || completeHandoverMutation.isPending}
                        className="h-4 w-4"
                        aria-label={t('handover.completeItem', { title: item.title })}
                      />
                      <div>
                        <p className={cn('font-medium', item.isCompleted && 'line-through text-muted-foreground')}>
                          {item.title}
                        </p>
                        {item.description && (
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        )}
                      </div>
                    </div>
                    {item.isCompleted && item.completedAt && (
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(item.completedAt), 'M/d HH:mm', { locale: ko })}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {renderDialogs()}
    </>
  );
}
