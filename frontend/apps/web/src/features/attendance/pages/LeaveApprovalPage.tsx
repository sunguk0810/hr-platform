import { useState } from 'react';
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
  const totalPages = listData?.data?.totalPages ?? 0;
  const summary = summaryData?.data;

  const handleApprove = async () => {
    if (!approveDialog.request) return;

    try {
      await approveMutation.mutateAsync({
        id: approveDialog.request.id,
        data: comment ? { comment } : undefined,
      });
      toast({
        title: '승인 완료',
        description: '휴가가 승인되었습니다.',
      });
      setApproveDialog({ open: false, request: null });
      setComment('');
    } catch (error) {
      toast({
        title: '승인 실패',
        description: '휴가 승인에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleReject = async () => {
    if (!rejectDialog.request || !rejectReason.trim()) {
      toast({
        title: '입력 오류',
        description: '반려 사유를 입력해주세요.',
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
        title: '반려 완료',
        description: '휴가가 반려되었습니다.',
      });
      setRejectDialog({ open: false, request: null });
      setRejectReason('');
    } catch (error) {
      toast({
        title: '반려 실패',
        description: '휴가 반려에 실패했습니다.',
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
        title: '일괄 승인 완료',
        description: `${result.data?.successCount}건이 승인되었습니다.`,
      });
      setBulkApproveDialog(false);
      setComment('');
      clearSelection();
    } catch (error) {
      toast({
        title: '일괄 승인 실패',
        description: '일부 항목의 승인에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleBulkReject = async () => {
    if (!rejectReason.trim()) {
      toast({
        title: '입력 오류',
        description: '반려 사유를 입력해주세요.',
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
        title: '일괄 반려 완료',
        description: `${result.data?.successCount}건이 반려되었습니다.`,
      });
      setBulkRejectDialog(false);
      setRejectReason('');
      clearSelection();
    } catch (error) {
      toast({
        title: '일괄 반려 실패',
        description: '일부 항목의 반려에 실패했습니다.',
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
              <h1 className="text-xl font-bold">휴가 승인</h1>
              <p className="text-sm text-muted-foreground">대기 중인 휴가 신청 검토</p>
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
              {mobileSelectionMode ? '선택 취소' : '선택'}
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-card rounded-xl border p-3 text-center">
              <Clock className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
              <p className="text-lg font-bold">{summary?.totalPending ?? 0}</p>
              <p className="text-xs text-muted-foreground">대기</p>
            </div>
            <div className="bg-card rounded-xl border p-3 text-center">
              <FileCheck className="h-4 w-4 text-blue-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-blue-600">{selectedCount}</p>
              <p className="text-xs text-muted-foreground">선택</p>
            </div>
            <div className={`rounded-xl border p-3 text-center ${summary?.urgentCount ? 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800' : 'bg-card'}`}>
              <AlertCircle className="h-4 w-4 text-red-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-red-600">{summary?.urgentCount ?? 0}</p>
              <p className="text-xs text-muted-foreground">긴급</p>
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
              title="대기 중인 휴가 신청이 없습니다"
              description="모든 휴가 신청이 처리되었습니다."
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
                          <Badge variant="destructive" className="text-xs">긴급</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <LeaveTypeBadge type={request.leaveType} />
                        <span className="text-xs text-muted-foreground">
                          잔여 {request.remainingDays}일
                        </span>
                      </div>
                      <p className="text-sm">
                        {format(new Date(request.startDate), 'M/d', { locale: ko })} ~{' '}
                        {format(new Date(request.endDate), 'M/d', { locale: ko })}
                        <span className="ml-2 font-medium">{request.days}일</span>
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
                        승인
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => setRejectDialog({ open: true, request })}
                      >
                        <XCircle className="mr-1 h-4 w-4" />
                        반려
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
                <span className="text-sm font-medium">{selectedCount}건 선택됨</span>
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-primary"
                >
                  {selectedCount === requests.length ? '전체 해제' : '전체 선택'}
                </button>
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  variant="outline"
                  onClick={() => setBulkRejectDialog(true)}
                >
                  <XCircle className="mr-2 h-4 w-4 text-red-600" />
                  반려
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => setBulkApproveDialog(true)}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  승인
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
              <DialogTitle>휴가 승인</DialogTitle>
              <DialogDescription>
                {approveDialog.request?.employeeName}님의 휴가 신청을 승인합니다.
              </DialogDescription>
            </DialogHeader>
            {approveDialog.request && (
              <div className="space-y-4">
                <div className="rounded-lg bg-muted/50 p-4">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">휴가 유형:</span>{' '}
                      <span className="font-medium">
                        {LEAVE_TYPE_LABELS[approveDialog.request.leaveType]}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">일수:</span>{' '}
                      <span className="font-medium">{approveDialog.request.days}일</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">기간:</span>{' '}
                      <span className="font-medium">
                        {format(new Date(approveDialog.request.startDate), 'yyyy년 M월 d일', { locale: ko })} ~{' '}
                        {format(new Date(approveDialog.request.endDate), 'M월 d일', { locale: ko })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="comment">코멘트 (선택)</Label>
                  <Textarea
                    id="comment"
                    placeholder="승인 코멘트를 입력하세요"
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
                취소
              </Button>
              <Button onClick={handleApprove} disabled={approveMutation.isPending}>
                {approveMutation.isPending ? '처리 중...' : '승인'}
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
              <DialogTitle>휴가 반려</DialogTitle>
              <DialogDescription>
                {rejectDialog.request?.employeeName}님의 휴가 신청을 반려합니다.
              </DialogDescription>
            </DialogHeader>
            {rejectDialog.request && (
              <div className="space-y-4">
                <div className="rounded-lg bg-muted/50 p-4">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">휴가 유형:</span>{' '}
                      <span className="font-medium">
                        {LEAVE_TYPE_LABELS[rejectDialog.request.leaveType]}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">일수:</span>{' '}
                      <span className="font-medium">{rejectDialog.request.days}일</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rejectReason">
                    반려 사유 <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="rejectReason"
                    placeholder="반려 사유를 입력하세요 (필수)"
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
                취소
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={!rejectReason.trim() || rejectMutation.isPending}
              >
                {rejectMutation.isPending ? '처리 중...' : '반려'}
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
              <DialogTitle>일괄 승인</DialogTitle>
              <DialogDescription>
                선택한 {selectedCount}건의 휴가 신청을 일괄 승인합니다.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="bulkComment">코멘트 (선택)</Label>
              <Textarea
                id="bulkComment"
                placeholder="승인 코멘트를 입력하세요"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBulkApproveDialog(false)}>
                취소
              </Button>
              <Button onClick={handleBulkApprove} disabled={bulkApproveMutation.isPending}>
                {bulkApproveMutation.isPending ? '처리 중...' : `${selectedCount}건 승인`}
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
              <DialogTitle>일괄 반려</DialogTitle>
              <DialogDescription>
                선택한 {selectedCount}건의 휴가 신청을 일괄 반려합니다.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="bulkRejectReason">
                반려 사유 <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="bulkRejectReason"
                placeholder="반려 사유를 입력하세요 (필수)"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBulkRejectDialog(false)}>
                취소
              </Button>
              <Button
                variant="destructive"
                onClick={handleBulkReject}
                disabled={!rejectReason.trim() || bulkRejectMutation.isPending}
              >
                {bulkRejectMutation.isPending ? '처리 중...' : `${selectedCount}건 반려`}
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
        title="휴가 승인"
        description="대기 중인 휴가 신청을 검토하고 승인/반려합니다."
      />

      {/* Summary Cards */}
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">대기 건수</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalPending ?? 0}건</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">선택 건수</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{selectedCount}건</div>
          </CardContent>
        </Card>
        <Card className={summary?.urgentCount ? 'border-red-200 bg-red-50' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-600">긴급</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {summary?.urgentCount ?? 0}건
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Bulk Actions */}
      <Card className="mb-6">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">휴가 유형</span>
              <Select
                value={searchState.leaveType || 'all'}
                onValueChange={(value) => setLeaveType(value === 'all' ? '' : value as LeaveType)}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="전체" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
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
                필터 초기화
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
                선택 승인 ({selectedCount})
              </Button>
              <Button
                variant="outline"
                onClick={() => setBulkRejectDialog(true)}
                className="text-red-600 hover:text-red-700"
              >
                <XCircle className="mr-2 h-4 w-4" />
                선택 반려 ({selectedCount})
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Request Table */}
      <Card>
        <CardHeader>
          <CardTitle>대기 목록</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4">
              <SkeletonTable rows={5} />
            </div>
          ) : requests.length === 0 ? (
            <EmptyState
              icon={FileCheck}
              title="대기 중인 휴가 신청이 없습니다"
              description="모든 휴가 신청이 처리되었습니다."
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
                        신청자
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        휴가 유형
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        기간
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                        일수
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                        잔여연차
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        사유
                      </th>
                      <th className="w-[180px] px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                        액션
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
                                긴급
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
                          {request.days}일
                        </td>
                        <td className="px-4 py-3 text-right text-sm tabular-nums">
                          {request.remainingDays}일
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
                              승인
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setRejectDialog({ open: true, request })}
                              className="text-red-600 hover:text-red-700"
                            >
                              <XCircle className="mr-1 h-3 w-3" />
                              반려
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
            <DialogTitle>휴가 승인</DialogTitle>
            <DialogDescription>
              {approveDialog.request?.employeeName}님의 휴가 신청을 승인합니다.
            </DialogDescription>
          </DialogHeader>
          {approveDialog.request && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">휴가 유형:</span>{' '}
                    <span className="font-medium">
                      {LEAVE_TYPE_LABELS[approveDialog.request.leaveType]}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">일수:</span>{' '}
                    <span className="font-medium">{approveDialog.request.days}일</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">기간:</span>{' '}
                    <span className="font-medium">
                      {format(new Date(approveDialog.request.startDate), 'yyyy년 M월 d일', { locale: ko })} ~{' '}
                      {format(new Date(approveDialog.request.endDate), 'M월 d일', { locale: ko })}
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="comment">코멘트 (선택)</Label>
                <Textarea
                  id="comment"
                  placeholder="승인 코멘트를 입력하세요"
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
              취소
            </Button>
            <Button onClick={handleApprove} disabled={approveMutation.isPending}>
              {approveMutation.isPending ? '처리 중...' : '승인'}
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
            <DialogTitle>휴가 반려</DialogTitle>
            <DialogDescription>
              {rejectDialog.request?.employeeName}님의 휴가 신청을 반려합니다.
            </DialogDescription>
          </DialogHeader>
          {rejectDialog.request && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">휴가 유형:</span>{' '}
                    <span className="font-medium">
                      {LEAVE_TYPE_LABELS[rejectDialog.request.leaveType]}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">일수:</span>{' '}
                    <span className="font-medium">{rejectDialog.request.days}일</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rejectReason">
                  반려 사유 <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="rejectReason"
                  placeholder="반려 사유를 입력하세요 (필수)"
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
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectReason.trim() || rejectMutation.isPending}
            >
              {rejectMutation.isPending ? '처리 중...' : '반려'}
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
            <DialogTitle>일괄 승인</DialogTitle>
            <DialogDescription>
              선택한 {selectedCount}건의 휴가 신청을 일괄 승인합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="bulkComment">코멘트 (선택)</Label>
            <Textarea
              id="bulkComment"
              placeholder="승인 코멘트를 입력하세요"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkApproveDialog(false)}>
              취소
            </Button>
            <Button onClick={handleBulkApprove} disabled={bulkApproveMutation.isPending}>
              {bulkApproveMutation.isPending ? '처리 중...' : `${selectedCount}건 승인`}
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
            <DialogTitle>일괄 반려</DialogTitle>
            <DialogDescription>
              선택한 {selectedCount}건의 휴가 신청을 일괄 반려합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="bulkRejectReason">
              반려 사유 <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="bulkRejectReason"
              placeholder="반려 사유를 입력하세요 (필수)"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkRejectDialog(false)}>
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkReject}
              disabled={!rejectReason.trim() || bulkRejectMutation.isPending}
            >
              {bulkRejectMutation.isPending ? '처리 중...' : `${selectedCount}건 반려`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
