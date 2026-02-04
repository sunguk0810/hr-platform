import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StatusBadge, StatusType } from '@/components/common/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useTransferList, useApproveTransfer, useCancelTransfer, useTransferSearchParams } from '../hooks/useEmployees';
import { useToast } from '@/hooks/useToast';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import type { TransferStatus, EmployeeTransfer, TransferApprovalRequest } from '@hr-platform/shared-types';
import { Check, X, Eye, ArrowRightLeft, RefreshCw } from 'lucide-react';

const statusOptions: { value: TransferStatus | ''; label: string }[] = [
  { value: '', label: '전체' },
  { value: 'PENDING_SOURCE_APPROVAL', label: '전출승인대기' },
  { value: 'PENDING_TARGET_APPROVAL', label: '전입승인대기' },
  { value: 'COMPLETED', label: '완료' },
  { value: 'REJECTED', label: '반려' },
  { value: 'CANCELLED', label: '취소' },
];

const transferTypeLabels: Record<string, string> = {
  PERMANENT: '영구 전출',
  TEMPORARY: '임시 전출',
  DISPATCH: '파견',
};

function getStatusBadgeProps(status: TransferStatus): { type: StatusType; label: string } {
  const statusMap: Record<TransferStatus, { type: StatusType; label: string }> = {
    PENDING_SOURCE_APPROVAL: { type: 'pending', label: '전출승인대기' },
    PENDING_TARGET_APPROVAL: { type: 'warning', label: '전입승인대기' },
    COMPLETED: { type: 'success', label: '완료' },
    REJECTED: { type: 'error', label: '반려' },
    CANCELLED: { type: 'default', label: '취소' },
  };
  return statusMap[status] || { type: 'default', label: status };
}

interface TransferListProps {
  showActions?: boolean;
}

export function TransferList({ showActions = true }: TransferListProps) {
  const { toast } = useToast();
  const { params, searchState, setStatus, setPage } = useTransferSearchParams();
  const { data, isLoading, refetch } = useTransferList(params);
  const approveMutation = useApproveTransfer();
  const cancelMutation = useCancelTransfer();

  const [selectedTransfer, setSelectedTransfer] = useState<EmployeeTransfer | null>(null);
  const [dialogType, setDialogType] = useState<'approve' | 'reject' | 'cancel' | null>(null);

  const transfers = data?.data?.content ?? [];
  const totalPages = data?.data?.totalPages ?? 0;

  const handleApprove = async () => {
    if (!selectedTransfer) return;

    const request: TransferApprovalRequest = {
      approved: true,
    };

    try {
      await approveMutation.mutateAsync({ transferId: selectedTransfer.id, data: request });
      toast({
        title: '승인 완료',
        description: '전출 요청이 승인되었습니다.',
      });
      setDialogType(null);
      setSelectedTransfer(null);
      refetch();
    } catch {
      toast({
        title: '승인 실패',
        description: '전출 승인 처리 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleReject = async () => {
    if (!selectedTransfer) return;

    const request: TransferApprovalRequest = {
      approved: false,
      remarks: '반려 처리됨',
    };

    try {
      await approveMutation.mutateAsync({ transferId: selectedTransfer.id, data: request });
      toast({
        title: '반려 완료',
        description: '전출 요청이 반려되었습니다.',
      });
      setDialogType(null);
      setSelectedTransfer(null);
      refetch();
    } catch {
      toast({
        title: '반려 실패',
        description: '전출 반려 처리 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleCancel = async () => {
    if (!selectedTransfer) return;

    try {
      await cancelMutation.mutateAsync({ transferId: selectedTransfer.id, reason: '요청자에 의한 취소' });
      toast({
        title: '취소 완료',
        description: '전출 요청이 취소되었습니다.',
      });
      setDialogType(null);
      setSelectedTransfer(null);
      refetch();
    } catch {
      toast({
        title: '취소 실패',
        description: '전출 취소 처리 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  const openDialog = (transfer: EmployeeTransfer, type: 'approve' | 'reject' | 'cancel') => {
    setSelectedTransfer(transfer);
    setDialogType(type);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            전출/전입 현황
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5" />
              전출/전입 현황
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select
                value={searchState.status}
                onValueChange={(value) => setStatus(value as TransferStatus | '')}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="상태 필터" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value || 'all'} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {transfers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              전출/전입 요청 내역이 없습니다.
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>사원명</TableHead>
                    <TableHead>전출처</TableHead>
                    <TableHead>전입처</TableHead>
                    <TableHead>유형</TableHead>
                    <TableHead>발령일</TableHead>
                    <TableHead>상태</TableHead>
                    {showActions && <TableHead className="text-right">액션</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transfers.map((transfer) => {
                    const statusBadge = getStatusBadgeProps(transfer.status);
                    const canApprove =
                      transfer.status === 'PENDING_SOURCE_APPROVAL' ||
                      transfer.status === 'PENDING_TARGET_APPROVAL';
                    const canCancel =
                      transfer.status === 'PENDING_SOURCE_APPROVAL' ||
                      transfer.status === 'PENDING_TARGET_APPROVAL';

                    return (
                      <TableRow key={transfer.id}>
                        <TableCell className="font-medium">
                          <div>
                            <div>{transfer.employeeName}</div>
                            <div className="text-xs text-muted-foreground">
                              {transfer.employeeNumber}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="text-sm">{transfer.sourceTenantName}</div>
                            <div className="text-xs text-muted-foreground">
                              {transfer.sourceDepartmentName}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="text-sm">{transfer.targetTenantName}</div>
                            <div className="text-xs text-muted-foreground">
                              {transfer.targetDepartmentName}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{transferTypeLabels[transfer.transferType]}</TableCell>
                        <TableCell>{formatDate(transfer.effectiveDate)}</TableCell>
                        <TableCell>
                          <StatusBadge status={statusBadge.type} label={statusBadge.label} />
                        </TableCell>
                        {showActions && (
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" title="상세 보기">
                                <Eye className="h-4 w-4" />
                              </Button>
                              {canApprove && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-green-600 hover:text-green-700"
                                    title="승인"
                                    onClick={() => openDialog(transfer, 'approve')}
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive hover:text-destructive"
                                    title="반려"
                                    onClick={() => openDialog(transfer, 'reject')}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              {canCancel && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-muted-foreground"
                                  title="취소"
                                  onClick={() => openDialog(transfer, 'cancel')}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(searchState.page - 1)}
                    disabled={searchState.page === 0}
                  >
                    이전
                  </Button>
                  <span className="flex items-center px-3 text-sm">
                    {searchState.page + 1} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(searchState.page + 1)}
                    disabled={searchState.page >= totalPages - 1}
                  >
                    다음
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Approve Dialog */}
      <ConfirmDialog
        open={dialogType === 'approve'}
        onOpenChange={(open) => !open && setDialogType(null)}
        title="전출 승인"
        description={`${selectedTransfer?.employeeName}님의 전출 요청을 승인하시겠습니까?`}
        confirmLabel="승인"
        onConfirm={handleApprove}
        isLoading={approveMutation.isPending}
      />

      {/* Reject Dialog */}
      <ConfirmDialog
        open={dialogType === 'reject'}
        onOpenChange={(open) => !open && setDialogType(null)}
        title="전출 반려"
        description={`${selectedTransfer?.employeeName}님의 전출 요청을 반려하시겠습니까?`}
        confirmLabel="반려"
        variant="destructive"
        onConfirm={handleReject}
        isLoading={approveMutation.isPending}
      />

      {/* Cancel Dialog */}
      <ConfirmDialog
        open={dialogType === 'cancel'}
        onOpenChange={(open) => !open && setDialogType(null)}
        title="전출 요청 취소"
        description={`${selectedTransfer?.employeeName}님의 전출 요청을 취소하시겠습니까?`}
        confirmLabel="취소하기"
        variant="destructive"
        onConfirm={handleCancel}
        isLoading={cancelMutation.isPending}
      />
    </>
  );
}
