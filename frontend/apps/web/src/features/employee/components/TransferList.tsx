import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import { useTransferList, useApproveTransferSource, useApproveTransferTarget, useRejectTransfer, useCancelTransfer, useTransferSearchParams } from '../hooks/useEmployees';
import { useToast } from '@/hooks/useToast';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import type { EmployeeTransferStatus, EmployeeTransfer } from '@hr-platform/shared-types';
import { Check, X, Eye, ArrowRightLeft, RefreshCw } from 'lucide-react';

const statusOptionValues: (EmployeeTransferStatus | '')[] = [
  '', 'PENDING_SOURCE_APPROVAL', 'PENDING_TARGET_APPROVAL', 'COMPLETED', 'REJECTED', 'CANCELLED',
];

const transferTypeKeys: Record<string, string> = {
  PERMANENT: 'transfer.typeOptions.PERMANENT',
  TEMPORARY: 'transfer.typeOptions.TEMPORARY',
  DISPATCH: 'transfer.typeOptions.DISPATCH',
};

const statusBadgeTypeMap: Record<EmployeeTransferStatus, StatusType> = {
  PENDING_SOURCE_APPROVAL: 'pending',
  PENDING_TARGET_APPROVAL: 'warning',
  COMPLETED: 'success',
  REJECTED: 'error',
  CANCELLED: 'default',
};

interface TransferListProps {
  showActions?: boolean;
}

export function TransferList({ showActions = true }: TransferListProps) {
  const { t } = useTranslation('employee');
  const { toast } = useToast();
  const { params, searchState, setStatus, setPage } = useTransferSearchParams();
  const { data, isLoading, refetch } = useTransferList(params);
  const approveSourceMutation = useApproveTransferSource();
  const approveTargetMutation = useApproveTransferTarget();
  const rejectMutation = useRejectTransfer();
  const cancelMutation = useCancelTransfer();

  const [selectedTransfer, setSelectedTransfer] = useState<EmployeeTransfer | null>(null);
  const [dialogType, setDialogType] = useState<'approve' | 'reject' | 'cancel' | null>(null);

  const transfers = data?.data?.content ?? [];
  const totalPages = data?.data?.page?.totalPages ?? 0;

  const isApproving = approveSourceMutation.isPending || approveTargetMutation.isPending;

  const handleApprove = async () => {
    if (!selectedTransfer) return;

    try {
      // Use the appropriate approval mutation based on current status
      if (selectedTransfer.status === 'PENDING_SOURCE_APPROVAL') {
        await approveSourceMutation.mutateAsync({ transferId: selectedTransfer.id });
      } else if (selectedTransfer.status === 'PENDING_TARGET_APPROVAL') {
        await approveTargetMutation.mutateAsync({ transferId: selectedTransfer.id });
      }
      toast({
        title: t('toast.approveComplete'),
        description: t('transferList.approveSuccess'),
      });
      setDialogType(null);
      setSelectedTransfer(null);
      refetch();
    } catch {
      toast({
        title: t('toast.approveFailure'),
        description: t('transferList.approveFailure'),
        variant: 'destructive',
      });
    }
  };

  const handleReject = async () => {
    if (!selectedTransfer) return;

    try {
      await rejectMutation.mutateAsync({ transferId: selectedTransfer.id, reason: '반려 처리됨' });
      toast({
        title: t('toast.rejectComplete'),
        description: t('transferList.rejectSuccess'),
      });
      setDialogType(null);
      setSelectedTransfer(null);
      refetch();
    } catch {
      toast({
        title: t('toast.rejectFailure'),
        description: t('transferList.rejectFailure'),
        variant: 'destructive',
      });
    }
  };

  const handleCancel = async () => {
    if (!selectedTransfer) return;

    try {
      await cancelMutation.mutateAsync({ transferId: selectedTransfer.id, reason: '요청자에 의한 취소' });
      toast({
        title: t('toast.cancelComplete'),
        description: t('transferList.cancelSuccess'),
      });
      setDialogType(null);
      setSelectedTransfer(null);
      refetch();
    } catch {
      toast({
        title: t('toast.cancelFailure'),
        description: t('transferList.cancelFailure'),
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
            {t('transferList.title')}
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
              {t('transferList.title')}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select
                value={searchState.status}
                onValueChange={(value) => setStatus(value as EmployeeTransferStatus | '')}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder={t('transferList.statusFilter')} />
                </SelectTrigger>
                <SelectContent>
                  {statusOptionValues.map((value) => (
                    <SelectItem key={value || 'all'} value={value}>
                      {value ? t(`transferList.statusOptions.${value}`) : t('common.all')}
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
              {t('transferList.empty')}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('transferList.tableEmployee')}</TableHead>
                    <TableHead>{t('transferList.tableSource')}</TableHead>
                    <TableHead>{t('transferList.tableTarget')}</TableHead>
                    <TableHead>{t('transferList.tableType')}</TableHead>
                    <TableHead>{t('transferList.tableEffectiveDate')}</TableHead>
                    <TableHead>{t('transferList.tableStatus')}</TableHead>
                    {showActions && <TableHead className="text-right">{t('transferList.tableAction')}</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transfers.map((transfer) => {
                    const statusBadge = {
                      type: statusBadgeTypeMap[transfer.status] || ('default' as StatusType),
                      label: t(`transferList.statusOptions.${transfer.status}`, transfer.status),
                    };
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
                        <TableCell>{t(transferTypeKeys[transfer.transferType])}</TableCell>
                        <TableCell>{formatDate(transfer.effectiveDate)}</TableCell>
                        <TableCell>
                          <StatusBadge status={statusBadge.type} label={statusBadge.label} />
                        </TableCell>
                        {showActions && (
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" title={t('transferList.viewDetail')}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              {canApprove && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-green-600 hover:text-green-700"
                                    title={t('transferList.approve')}
                                    onClick={() => openDialog(transfer, 'approve')}
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive hover:text-destructive"
                                    title={t('transferList.reject')}
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
                                  title={t('transferList.cancelAction')}
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
                    {t('common.previous')}
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
                    {t('common.next')}
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
        title={t('transferList.approveTitle')}
        description={t('transferList.approveDescription', { name: selectedTransfer?.employeeName })}
        confirmLabel={t('transferList.approve')}
        onConfirm={handleApprove}
        isLoading={isApproving}
      />

      {/* Reject Dialog */}
      <ConfirmDialog
        open={dialogType === 'reject'}
        onOpenChange={(open) => !open && setDialogType(null)}
        title={t('transferList.rejectTitle')}
        description={t('transferList.rejectDescription', { name: selectedTransfer?.employeeName })}
        confirmLabel={t('transferList.reject')}
        variant="destructive"
        onConfirm={handleReject}
        isLoading={rejectMutation.isPending}
      />

      {/* Cancel Dialog */}
      <ConfirmDialog
        open={dialogType === 'cancel'}
        onOpenChange={(open) => !open && setDialogType(null)}
        title={t('transferList.cancelTitle')}
        description={t('transferList.cancelDescription', { name: selectedTransfer?.employeeName })}
        confirmLabel={t('transferList.cancelLabel')}
        variant="destructive"
        onConfirm={handleCancel}
        isLoading={cancelMutation.isPending}
      />
    </>
  );
}
