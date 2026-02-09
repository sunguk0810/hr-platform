import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  FileCheck,
  Check,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { SkeletonTable } from '@/components/common/Skeleton';
import { Pagination } from '@/components/common/Pagination';
import { PullToRefreshContainer } from '@/components/mobile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useIsMobile } from '@/hooks/useMediaQuery';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  usePendingLeaveRequests,
  usePendingLeaveSummary,
  usePendingLeaveSearchParams,
  useLeaveRequestSelection,
  useApproveLeaveRequest,
  useRejectLeaveRequest,
  useBulkApproveLeaveRequests,
  useBulkRejectLeaveRequests,
} from '../hooks/useLeaveApproval';
import { useToast } from '@/hooks/useToast';
import { LEAVE_TYPE_LABELS } from '@hr-platform/shared-types';
import type { LeaveType, PendingLeaveRequest } from '@hr-platform/shared-types';

function LeaveTypeBadge({ type }: { type: LeaveType }) {
  const colors: Record<LeaveType, string> = {
    ANNUAL: 'bg-blue-100 text-blue-700',
    SICK: 'bg-red-100 text-red-700',
    SPECIAL: 'bg-purple-100 text-purple-700',
    HALF_DAY_AM: 'bg-green-100 text-green-700',
    HALF_DAY_PM: 'bg-green-100 text-green-700',
    HOURLY: 'bg-orange-100 text-orange-700',
    MATERNITY: 'bg-pink-100 text-pink-700',
    PATERNITY: 'bg-cyan-100 text-cyan-700',
    UNPAID: 'bg-gray-100 text-gray-700',
  };

  return (
    <Badge variant="outline" className={`${colors[type]} border-0`}>
      {LEAVE_TYPE_LABELS[type]}
    </Badge>
  );
}

export default function LeaveApprovalPage() {
  const { t } = useTranslation('attendance');
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const { toast } = useToast();

  const {
    params,
    searchState,
    setLeaveType,
    setPage,
    resetFilters,
  } = usePendingLeaveSearchParams();

  const { data: listData, isLoading } = usePendingLeaveRequests(params);
  const { data: summaryData } = usePendingLeaveSummary();

  const {
    selectedArray,
    selectedCount,
    toggleSelection,
    selectAll,
    clearSelection,
    isSelected,
  } = useLeaveRequestSelection();

  const approveMutation = useApproveLeaveRequest();
  const rejectMutation = useRejectLeaveRequest();
  const bulkApproveMutation = useBulkApproveLeaveRequests();
  const bulkRejectMutation = useBulkRejectLeaveRequests();

  const [approveDialog, setApproveDialog] = useState<{
    open: boolean;
    request: PendingLeaveRequest | null;
  }>({ open: false, request: null });
  const [rejectDialog, setRejectDialog] = useState<{
    open: boolean;
    request: PendingLeaveRequest | null;
  }>({ open: false, request: null });
  const [bulkApproveDialog, setBulkApproveDialog] = useState(false);
  const [bulkRejectDialog, setBulkRejectDialog] = useState(false);

  const [comment, setComment] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [mobileSelectionMode, setMobileSelectionMode] = useState(false);

  const requests = listData?.data?.content ?? [];
  const totalPages = listData?.data?.page?.totalPages ?? 0;
  const summary = summaryData?.data;

  const handleApprove = async () => {
    if (!approveDialog.request) return;

    try {
      await approveMutation.mutateAsync({
        id: approveDialog.request.id,
        data: comment ? { comment } : undefined,
      });
      toast({
        title: t('leaveApprovalPage.toast.approveSuccess'),
        description: t('leaveApprovalPage.toast.approveSuccessMessage'),
      });
      setApproveDialog({ open: false, request: null });
      setComment('');
    } catch (error) {
      toast({
        title: t('leaveApprovalPage.toast.approveFail'),
        description: t('leaveApprovalPage.toast.approveFailMessage'),
        variant: 'destructive',
      });
    }
  };

  const handleReject = async () => {
    if (!rejectDialog.request || !rejectReason.trim()) {
      toast({
        title: t('leaveApprovalPage.toast.inputError'),
        description: t('leaveApprovalPage.toast.rejectReasonRequired'),
        variant: 'destructive',
      });
      return;
    }

    try {
      await rejectMutation.mutateAsync({
        id: rejectDialog.request.id,
        data: { reason: rejectReason },
      });
      toast({
        title: t('leaveApprovalPage.toast.rejectSuccess'),
        description: t('leaveApprovalPage.toast.rejectSuccessMessage'),
      });
      setRejectDialog({ open: false, request: null });
      setRejectReason('');
    } catch (error) {
      toast({
        title: t('leaveApprovalPage.toast.rejectFail'),
        description: t('leaveApprovalPage.toast.rejectFailMessage'),
        variant: 'destructive',
      });
    }
  };

  const handleBulkApprove = async () => {
    try {
      const result = await bulkApproveMutation.mutateAsync({
        leaveRequestIds: selectedArray,
        comment: comment || undefined,
      });
      toast({
        title: t('leaveApprovalPage.toast.bulkApproveSuccess'),
        description: t('leaveApprovalPage.toast.bulkApproveSuccessMessage', { count: result.data?.successCount }),
      });
      setBulkApproveDialog(false);
      setComment('');
      clearSelection();
    } catch (error) {
      toast({
        title: t('leaveApprovalPage.toast.bulkApproveFail'),
        description: t('leaveApprovalPage.toast.bulkApproveFailMessage'),
        variant: 'destructive',
      });
    }
  };

  const handleBulkReject = async () => {
    if (!rejectReason.trim()) {
      toast({
        title: t('leaveApprovalPage.toast.inputError'),
        description: t('leaveApprovalPage.toast.rejectReasonRequired'),
        variant: 'destructive',
      });
      return;
    }

    try {
      const result = await bulkRejectMutation.mutateAsync({
        leaveRequestIds: selectedArray,
        reason: rejectReason,
      });
      toast({
        title: t('leaveApprovalPage.toast.bulkRejectSuccess'),
        description: t('leaveApprovalPage.toast.bulkRejectSuccessMessage', { count: result.data?.successCount }),
      });
      setBulkRejectDialog(false);
      setRejectReason('');
      clearSelection();
    } catch (error) {
      toast({
        title: t('leaveApprovalPage.toast.bulkRejectFail'),
        description: t('leaveApprovalPage.toast.bulkRejectFailMessage'),
        variant: 'destructive',
      });
    }
  };

  const handleSelectAll = () => {
    if (selectedCount === requests.length) {
      clearSelection();
    } else {
      selectAll(requests.map((r) => r.id));
    }
  };

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['pending-leave-requests'] });
    await queryClient.invalidateQueries({ queryKey: ['pending-leave-summary'] });
  };

  const toggleMobileSelection = (id: string) => {
    toggleSelection(id);
  };

  // Mobile Layout
  if (isMobile) {
    return (
      <PullToRefreshContainer onRefresh={handleRefresh}>
        <div className="space-y-4 pb-32">
          {/* Mobile Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">{t('leaveApprovalPage.title')}</h1>
              <p className="text-sm text-muted-foreground">{t('leaveApprovalPage.mobileDescription')}</p>
            </div>
            <button
              onClick={() => {
                if (mobileSelectionMode) {
                  clearSelection();
                }
                setMobileSelectionMode(!mobileSelectionMode);
              }}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                mobileSelectionMode
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {mobileSelectionMode ? t('leaveApprovalPage.cancelSelection') : t('leaveApprovalPage.selectMode')}
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-card rounded-xl border p-3 text-center">
              <Clock className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
              <p className="text-lg font-bold">{summary?.totalPending ?? 0}</p>
              <p className="text-xs text-muted-foreground">{t('leaveApprovalPage.summaryCards.pending')}</p>
            </div>
            <div className="bg-card rounded-xl border p-3 text-center">
              <FileCheck className="h-4 w-4 text-blue-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-blue-600">{selectedCount}</p>
              <p className="text-xs text-muted-foreground">{t('leaveApprovalPage.summaryCards.selected')}</p>
            </div>
            <div className={`rounded-xl border p-3 text-center ${summary?.urgentCount ? 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800' : 'bg-card'}`}>
              <AlertCircle className="h-4 w-4 text-red-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-red-600">{summary?.urgentCount ?? 0}</p>
              <p className="text-xs text-muted-foreground">{t('leaveApprovalPage.summaryCards.urgent')}</p>
            </div>
          </div>

          {/* Mobile Pending Leave List */}
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
              ))}
            </div>
          ) : requests.length === 0 ? (
            <EmptyState
              icon={FileCheck}
              title={t('leaveApprovalPage.pendingList.empty.title')}
              description={t('leaveApprovalPage.pendingList.empty.description')}
            />
          ) : (
            <div className="space-y-3">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className={`bg-card rounded-xl border p-4 transition-colors ${
                    request.isUrgent ? 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/50' : ''
                  } ${isSelected(request.id) ? 'ring-2 ring-primary' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    {/* Selection Checkbox */}
                    {mobileSelectionMode && (
                      <button
                        onClick={() => toggleMobileSelection(request.id)}
                        className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                          isSelected(request.id)
                            ? 'bg-primary border-primary'
                            : 'border-muted-foreground'
                        }`}
                      >
                        {isSelected(request.id) && <Check className="h-4 w-4 text-primary-foreground" />}
                      </button>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{request.employeeName}</span>
                        {request.isUrgent && (
                          <Badge variant="destructive" className="text-xs">{t('leaveApprovalPage.summaryCards.urgent')}</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <LeaveTypeBadge type={request.leaveType} />
                        <span className="text-xs text-muted-foreground">
                          {t('leaveApprovalPage.remaining', { count: request.remainingDays })}
                        </span>
                      </div>
                      <p className="text-sm">
                        {format(new Date(request.startDate), 'M/d', { locale: ko })} ~{' '}
                        {format(new Date(request.endDate), 'M/d', { locale: ko })}
                        <span className="ml-2 font-medium">{t('leaveApprovalPage.daysUnit', { count: request.days })}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 truncate">{request.reason}</p>
                    </div>
                  </div>

                  {/* Individual Actions (when not in selection mode) */}
                  {!mobileSelectionMode && (
                    <div className="flex gap-2 mt-3 pt-3 border-t">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={() => setApproveDialog({ open: true, request })}
                      >
                        <CheckCircle className="mr-1 h-4 w-4" />
                        {t('leaveApprovalPage.approve')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => setRejectDialog({ open: true, request })}
                      >
                        <XCircle className="mr-1 h-4 w-4" />
                        {t('leaveApprovalPage.reject')}
                      </Button>
                    </div>
                  )}
                </div>
              ))}

              {totalPages > 1 && (
                <Pagination
                  page={searchState.page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              )}
            </div>
          )}

          {/* Mobile Bulk Action Bar */}
          {mobileSelectionMode && selectedCount > 0 && (
            <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 pb-safe z-50">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">{t('leaveApprovalPage.selectedCount', { count: selectedCount })}</span>
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-primary"
                >
                  {selectedCount === requests.length ? t('leaveApprovalPage.deselectAll') : t('leaveApprovalPage.selectAll')}
                </button>
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  variant="outline"
                  onClick={() => setBulkRejectDialog(true)}
                >
                  <XCircle className="mr-2 h-4 w-4 text-red-600" />
                  {t('leaveApprovalPage.reject')}
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => setBulkApproveDialog(true)}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {t('leaveApprovalPage.approve')}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Dialogs (same as desktop) */}
        {/* Single Approve Dialog */}
        <Dialog open={approveDialog.open} onOpenChange={(open) => {
          setApproveDialog({ open, request: open ? approveDialog.request : null });
          if (!open) setComment('');
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('leaveApprovalPage.approveDialog.title')}</DialogTitle>
              <DialogDescription>
                {t('leaveApprovalPage.approveDialog.description', { name: approveDialog.request?.employeeName })}
              </DialogDescription>
            </DialogHeader>
            {approveDialog.request && (
              <div className="space-y-4">
                <div className="rounded-lg bg-muted/50 p-4">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">{t('leaveApprovalPage.approveDialog.leaveType')}</span>{' '}
                      <span className="font-medium">
                        {LEAVE_TYPE_LABELS[approveDialog.request.leaveType]}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t('leaveApprovalPage.approveDialog.days')}</span>{' '}
                      <span className="font-medium">{t('leaveApprovalPage.daysUnit', { count: approveDialog.request.days })}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">{t('leaveApprovalPage.approveDialog.period')}</span>{' '}
                      <span className="font-medium">
                        {format(new Date(approveDialog.request.startDate), 'yyyy년 M월 d일', { locale: ko })} ~{' '}
                        {format(new Date(approveDialog.request.endDate), 'M월 d일', { locale: ko })}
                      </span>
                    </div>
                  </div>
                </div>
                {/* 잔여일수 차감 피드백 */}
                <Alert variant={approveDialog.request.remainingDays - approveDialog.request.days < 0 ? 'destructive' : 'default'} role="alert">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>{t('leaveApprovalPage.approveDialog.balanceChangeTitle')}</AlertTitle>
                  <AlertDescription>
                    <div className="flex items-center gap-2 mt-1">
                      <span>{t('leaveApprovalPage.approveDialog.currentBalance', { count: approveDialog.request.remainingDays })}</span>
                      <span>&rarr;</span>
                      <span><strong className={approveDialog.request.remainingDays - approveDialog.request.days < 0 ? 'text-destructive' : ''}>
                        {t('leaveApprovalPage.approveDialog.afterDeduction', { count: approveDialog.request.remainingDays - approveDialog.request.days })}
                      </strong></span>
                    </div>
                    {approveDialog.request.remainingDays - approveDialog.request.days < 0 && (
                      <p className="text-sm text-destructive mt-1 font-medium">
                        {t('leaveApprovalPage.approveDialog.insufficientBalance')}
                      </p>
                    )}
                  </AlertDescription>
                </Alert>
                <div className="space-y-2">
                  <Label htmlFor="comment">{t('leaveApprovalPage.approveDialog.commentLabel')}</Label>
                  <Textarea
                    id="comment"
                    placeholder={t('leaveApprovalPage.approveDialog.commentPlaceholder')}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setApproveDialog({ open: false, request: null })}
              >
                {t('common:cancel')}
              </Button>
              <Button onClick={handleApprove} disabled={approveMutation.isPending}>
                {approveMutation.isPending ? t('common:processing') : t('leaveApprovalPage.approve')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Single Reject Dialog */}
        <Dialog open={rejectDialog.open} onOpenChange={(open) => {
          setRejectDialog({ open, request: open ? rejectDialog.request : null });
          if (!open) setRejectReason('');
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('leaveApprovalPage.rejectDialog.title')}</DialogTitle>
              <DialogDescription>
                {t('leaveApprovalPage.rejectDialog.description', { name: rejectDialog.request?.employeeName })}
              </DialogDescription>
            </DialogHeader>
            {rejectDialog.request && (
              <div className="space-y-4">
                <div className="rounded-lg bg-muted/50 p-4">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">{t('leaveApprovalPage.approveDialog.leaveType')}</span>{' '}
                      <span className="font-medium">
                        {LEAVE_TYPE_LABELS[rejectDialog.request.leaveType]}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t('leaveApprovalPage.approveDialog.days')}</span>{' '}
                      <span className="font-medium">{t('leaveApprovalPage.daysUnit', { count: rejectDialog.request.days })}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rejectReason">
                    {t('leaveApprovalPage.rejectDialog.reasonLabel')} <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="rejectReason"
                    placeholder={t('leaveApprovalPage.rejectDialog.reasonPlaceholder')}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setRejectDialog({ open: false, request: null })}
              >
                {t('common:cancel')}
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={!rejectReason.trim() || rejectMutation.isPending}
              >
                {rejectMutation.isPending ? t('common:processing') : t('leaveApprovalPage.reject')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bulk Approve Dialog */}
        <Dialog open={bulkApproveDialog} onOpenChange={(open) => {
          setBulkApproveDialog(open);
          if (!open) setComment('');
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('leaveApprovalPage.bulkApproveDialog.title')}</DialogTitle>
              <DialogDescription>
                {t('leaveApprovalPage.bulkApproveDialog.description', { count: selectedCount })}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="bulkComment">{t('leaveApprovalPage.bulkApproveDialog.commentLabel')}</Label>
              <Textarea
                id="bulkComment"
                placeholder={t('leaveApprovalPage.bulkApproveDialog.commentPlaceholder')}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBulkApproveDialog(false)}>
                {t('common:cancel')}
              </Button>
              <Button onClick={handleBulkApprove} disabled={bulkApproveMutation.isPending}>
                {bulkApproveMutation.isPending ? t('common:processing') : t('leaveApprovalPage.bulkApproveDialog.confirmButton', { count: selectedCount })}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bulk Reject Dialog */}
        <Dialog open={bulkRejectDialog} onOpenChange={(open) => {
          setBulkRejectDialog(open);
          if (!open) setRejectReason('');
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('leaveApprovalPage.bulkRejectDialog.title')}</DialogTitle>
              <DialogDescription>
                {t('leaveApprovalPage.bulkRejectDialog.description', { count: selectedCount })}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="bulkRejectReason">
                {t('leaveApprovalPage.bulkRejectDialog.reasonLabel')} <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="bulkRejectReason"
                placeholder={t('leaveApprovalPage.bulkRejectDialog.reasonPlaceholder')}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBulkRejectDialog(false)}>
                {t('common:cancel')}
              </Button>
              <Button
                variant="destructive"
                onClick={handleBulkReject}
                disabled={!rejectReason.trim() || bulkRejectMutation.isPending}
              >
                {bulkRejectMutation.isPending ? t('common:processing') : t('leaveApprovalPage.bulkRejectDialog.confirmButton', { count: selectedCount })}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PullToRefreshContainer>
    );
  }

  // Desktop Layout
  return (
    <>
      <PageHeader
        title={t('leaveApprovalPage.title')}
        description={t('leaveApprovalPage.description')}
      />

      {/* Summary Cards */}
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('leaveApprovalPage.summaryCards.pendingCount')}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{t('leaveApprovalPage.summaryCards.countUnit', { count: summary?.totalPending ?? 0 })}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('leaveApprovalPage.summaryCards.selectedCount')}</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{t('leaveApprovalPage.summaryCards.countUnit', { count: selectedCount })}</div>
          </CardContent>
        </Card>
        <Card className={summary?.urgentCount ? 'border-red-200 bg-red-50' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-600">{t('leaveApprovalPage.summaryCards.urgent')}</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {t('leaveApprovalPage.summaryCards.countUnit', { count: summary?.urgentCount ?? 0 })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Bulk Actions */}
      <Card className="mb-6">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{t('leaveApprovalPage.filterLeaveType')}</span>
              <Select
                value={searchState.leaveType || 'all'}
                onValueChange={(value) => setLeaveType(value === 'all' ? '' : value as LeaveType)}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder={t('leaveApprovalPage.filterAll')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('leaveApprovalPage.filterAll')}</SelectItem>
                  {Object.entries(LEAVE_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {searchState.leaveType && (
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                {t('leaveApprovalPage.resetFilter')}
              </Button>
            )}
          </div>

          {selectedCount > 0 && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setBulkApproveDialog(true)}
                className="text-green-600 hover:text-green-700"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                {t('leaveApprovalPage.bulkApproveButton', { count: selectedCount })}
              </Button>
              <Button
                variant="outline"
                onClick={() => setBulkRejectDialog(true)}
                className="text-red-600 hover:text-red-700"
              >
                <XCircle className="mr-2 h-4 w-4" />
                {t('leaveApprovalPage.bulkRejectButton', { count: selectedCount })}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Request Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('leaveApprovalPage.pendingList.title')}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4">
              <SkeletonTable rows={5} />
            </div>
          ) : requests.length === 0 ? (
            <EmptyState
              icon={FileCheck}
              title={t('leaveApprovalPage.pendingList.empty.title')}
              description={t('leaveApprovalPage.pendingList.empty.description')}
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="w-[50px] px-4 py-3 text-left">
                        <Checkbox
                          checked={selectedCount === requests.length && requests.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        {t('leaveApprovalPage.table.applicant')}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        {t('leaveApprovalPage.table.leaveType')}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        {t('leaveApprovalPage.table.period')}
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                        {t('leaveApprovalPage.table.days')}
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                        {t('leaveApprovalPage.table.remainingAnnual')}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        {t('leaveApprovalPage.table.reason')}
                      </th>
                      <th className="w-[180px] px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                        {t('leaveApprovalPage.table.action')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((request) => (
                      <tr
                        key={request.id}
                        className={`border-b transition-colors hover:bg-muted/50 ${
                          request.isUrgent ? 'bg-red-50 dark:bg-red-900/10' : ''
                        }`}
                      >
                        <td className="px-4 py-3">
                          <Checkbox
                            checked={isSelected(request.id)}
                            onCheckedChange={() => toggleSelection(request.id)}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{request.employeeName}</span>
                            {request.isUrgent && (
                              <Badge variant="destructive" className="text-xs">
                                {t('leaveApprovalPage.summaryCards.urgent')}
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <LeaveTypeBadge type={request.leaveType} />
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {format(new Date(request.startDate), 'M/d')} ~{' '}
                          {format(new Date(request.endDate), 'M/d')}
                        </td>
                        <td className="px-4 py-3 text-right text-sm tabular-nums">
                          {t('leaveApprovalPage.daysUnit', { count: request.days })}
                        </td>
                        <td className="px-4 py-3 text-right text-sm tabular-nums">
                          {t('leaveApprovalPage.daysUnit', { count: request.remainingDays })}
                        </td>
                        <td className="max-w-[200px] truncate px-4 py-3 text-sm text-muted-foreground">
                          {request.reason}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setApproveDialog({ open: true, request })}
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle className="mr-1 h-3 w-3" />
                              {t('leaveApprovalPage.approve')}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setRejectDialog({ open: true, request })}
                              className="text-red-600 hover:text-red-700"
                            >
                              <XCircle className="mr-1 h-3 w-3" />
                              {t('leaveApprovalPage.reject')}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                page={searchState.page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Single Approve Dialog */}
      <Dialog open={approveDialog.open} onOpenChange={(open) => {
        setApproveDialog({ open, request: open ? approveDialog.request : null });
        if (!open) setComment('');
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('leaveApprovalPage.approveDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('leaveApprovalPage.approveDialog.description', { name: approveDialog.request?.employeeName })}
            </DialogDescription>
          </DialogHeader>
          {approveDialog.request && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">{t('leaveApprovalPage.approveDialog.leaveType')}</span>{' '}
                    <span className="font-medium">
                      {LEAVE_TYPE_LABELS[approveDialog.request.leaveType]}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('leaveApprovalPage.approveDialog.days')}</span>{' '}
                    <span className="font-medium">{t('leaveApprovalPage.daysUnit', { count: approveDialog.request.days })}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">{t('leaveApprovalPage.approveDialog.period')}</span>{' '}
                    <span className="font-medium">
                      {format(new Date(approveDialog.request.startDate), 'yyyy년 M월 d일', { locale: ko })} ~{' '}
                      {format(new Date(approveDialog.request.endDate), 'M월 d일', { locale: ko })}
                    </span>
                  </div>
                </div>
              </div>
              {/* 잔여일수 차감 피드백 */}
              <Alert variant={approveDialog.request.remainingDays - approveDialog.request.days < 0 ? 'destructive' : 'default'} role="alert">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{t('leaveApprovalPage.approveDialog.balanceChangeTitle')}</AlertTitle>
                <AlertDescription>
                  <div className="flex items-center gap-2 mt-1">
                    <span>{t('leaveApprovalPage.approveDialog.currentBalance', { count: approveDialog.request.remainingDays })}</span>
                    <span>&rarr;</span>
                    <span><strong className={approveDialog.request.remainingDays - approveDialog.request.days < 0 ? 'text-destructive' : ''}>
                      {t('leaveApprovalPage.approveDialog.afterDeduction', { count: approveDialog.request.remainingDays - approveDialog.request.days })}
                    </strong></span>
                  </div>
                  {approveDialog.request.remainingDays - approveDialog.request.days < 0 && (
                    <p className="text-sm text-destructive mt-1 font-medium">
                      {t('leaveApprovalPage.approveDialog.insufficientBalance')}
                    </p>
                  )}
                </AlertDescription>
              </Alert>
              <div className="space-y-2">
                <Label htmlFor="comment">{t('leaveApprovalPage.approveDialog.commentLabel')}</Label>
                <Textarea
                  id="comment"
                  placeholder={t('leaveApprovalPage.approveDialog.commentPlaceholder')}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setApproveDialog({ open: false, request: null })}
            >
              {t('common:cancel')}
            </Button>
            <Button onClick={handleApprove} disabled={approveMutation.isPending}>
              {approveMutation.isPending ? t('common:processing') : t('leaveApprovalPage.approve')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Single Reject Dialog */}
      <Dialog open={rejectDialog.open} onOpenChange={(open) => {
        setRejectDialog({ open, request: open ? rejectDialog.request : null });
        if (!open) setRejectReason('');
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('leaveApprovalPage.rejectDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('leaveApprovalPage.rejectDialog.description', { name: rejectDialog.request?.employeeName })}
            </DialogDescription>
          </DialogHeader>
          {rejectDialog.request && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">{t('leaveApprovalPage.approveDialog.leaveType')}</span>{' '}
                    <span className="font-medium">
                      {LEAVE_TYPE_LABELS[rejectDialog.request.leaveType]}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('leaveApprovalPage.approveDialog.days')}</span>{' '}
                    <span className="font-medium">{t('leaveApprovalPage.daysUnit', { count: rejectDialog.request.days })}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rejectReason">
                  {t('leaveApprovalPage.rejectDialog.reasonLabel')} <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="rejectReason"
                  placeholder={t('leaveApprovalPage.rejectDialog.reasonPlaceholder')}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialog({ open: false, request: null })}
            >
              {t('common:cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectReason.trim() || rejectMutation.isPending}
            >
              {rejectMutation.isPending ? t('common:processing') : t('leaveApprovalPage.reject')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Approve Dialog */}
      <Dialog open={bulkApproveDialog} onOpenChange={(open) => {
        setBulkApproveDialog(open);
        if (!open) setComment('');
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('leaveApprovalPage.bulkApproveDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('leaveApprovalPage.bulkApproveDialog.description', { count: selectedCount })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="bulkComment">{t('leaveApprovalPage.bulkApproveDialog.commentLabel')}</Label>
            <Textarea
              id="bulkComment"
              placeholder={t('leaveApprovalPage.bulkApproveDialog.commentPlaceholder')}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkApproveDialog(false)}>
              {t('common:cancel')}
            </Button>
            <Button onClick={handleBulkApprove} disabled={bulkApproveMutation.isPending}>
              {bulkApproveMutation.isPending ? t('common:processing') : t('leaveApprovalPage.bulkApproveDialog.confirmButton', { count: selectedCount })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Reject Dialog */}
      <Dialog open={bulkRejectDialog} onOpenChange={(open) => {
        setBulkRejectDialog(open);
        if (!open) setRejectReason('');
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('leaveApprovalPage.bulkRejectDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('leaveApprovalPage.bulkRejectDialog.description', { count: selectedCount })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="bulkRejectReason">
              {t('leaveApprovalPage.bulkRejectDialog.reasonLabel')} <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="bulkRejectReason"
              placeholder={t('leaveApprovalPage.bulkRejectDialog.reasonPlaceholder')}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkRejectDialog(false)}>
              {t('common:cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkReject}
              disabled={!rejectReason.trim() || bulkRejectMutation.isPending}
            >
              {bulkRejectMutation.isPending ? t('common:processing') : t('leaveApprovalPage.bulkRejectDialog.confirmButton', { count: selectedCount })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
