import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { PageHeader } from '@/components/common/PageHeader';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
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
  ArrowLeft,
  RefreshCw,
  Check,
  X,
  Loader2,
  Building2,
  User,
  Calendar,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';
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
  TRANSFER_IN: <ArrowLeft className="h-5 w-5" aria-hidden="true" />,
  SECONDMENT: <RefreshCw className="h-5 w-5" aria-hidden="true" />,
};

export default function TransferDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [rejectComment, setRejectComment] = useState('');
  const [cancelReason, setCancelReason] = useState('');

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
        <span className="sr-only">로딩 중</span>
      </div>
    );
  }

  if (!transfer) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">인사이동 요청을 찾을 수 없습니다.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/transfer')}>
          목록으로 돌아가기
        </Button>
      </div>
    );
  }

  const handleApproveSource = async () => {
    try {
      await approveSourceMutation.mutateAsync({ id: transfer.id });
      toast({
        title: '전출 승인 완료',
        description: '전출이 승인되었습니다. 전입 테넌트의 승인을 대기합니다.',
      });
    } catch {
      toast({
        title: '승인 실패',
        description: '처리 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleApproveTarget = async () => {
    try {
      await approveTargetMutation.mutateAsync({ id: transfer.id });
      toast({
        title: '전입 승인 완료',
        description: '전입이 승인되었습니다.',
      });
    } catch {
      toast({
        title: '승인 실패',
        description: '처리 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleReject = async () => {
    if (!rejectComment.trim()) {
      toast({
        title: '거부 사유 필요',
        description: '거부 사유를 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await rejectMutation.mutateAsync({ id: transfer.id, data: { comment: rejectComment } });
      toast({
        title: '거부 완료',
        description: '인사이동 요청이 거부되었습니다.',
      });
      setIsRejectDialogOpen(false);
      setRejectComment('');
    } catch {
      toast({
        title: '거부 실패',
        description: '처리 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleComplete = async () => {
    try {
      await completeMutation.mutateAsync(transfer.id);
      toast({
        title: '완료 처리',
        description: '인사이동이 완료 처리되었습니다.',
      });
    } catch {
      toast({
        title: '완료 처리 실패',
        description: '처리 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleCancel = async () => {
    try {
      await cancelMutation.mutateAsync({ id: transfer.id, reason: cancelReason });
      toast({
        title: '취소 완료',
        description: '인사이동 요청이 취소되었습니다.',
      });
      setIsCancelDialogOpen(false);
      setCancelReason('');
    } catch {
      toast({
        title: '취소 실패',
        description: '처리 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleCompleteHandoverItem = async (itemId: string) => {
    try {
      await completeHandoverMutation.mutateAsync({ transferId: transfer.id, itemId });
    } catch {
      toast({
        title: '처리 실패',
        description: '인수인계 항목 완료 처리 중 오류가 발생했습니다.',
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

  return (
    <>
      <PageHeader
        title={`인사이동 상세 - ${transfer.requestNumber}`}
        description="인사이동 요청 상세 정보입니다."
        actions={
          <div className="flex gap-2">
            {canApproveSource && (
              <>
                <Button variant="outline" onClick={() => setIsRejectDialogOpen(true)} disabled={isPending}>
                  <X className="mr-2 h-4 w-4" aria-hidden="true" />
                  거부
                </Button>
                <Button onClick={handleApproveSource} disabled={isPending}>
                  {approveSourceMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Check className="mr-2 h-4 w-4" aria-hidden="true" />
                  )}
                  전출 승인
                </Button>
              </>
            )}
            {canApproveTarget && (
              <>
                <Button variant="outline" onClick={() => setIsRejectDialogOpen(true)} disabled={isPending}>
                  <X className="mr-2 h-4 w-4" aria-hidden="true" />
                  거부
                </Button>
                <Button onClick={handleApproveTarget} disabled={isPending}>
                  {approveTargetMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Check className="mr-2 h-4 w-4" aria-hidden="true" />
                  )}
                  전입 승인
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
                완료 처리
              </Button>
            )}
            {canCancel && (
              <Button variant="destructive" onClick={() => setIsCancelDialogOpen(true)} disabled={isPending}>
                취소
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
              요청 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">요청번호</span>
              <span className="font-mono">{transfer.requestNumber}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">이동 유형</span>
              <div className="flex items-center gap-2">
                {TYPE_ICONS[transfer.type]}
                <span>{TRANSFER_TYPE_LABELS[transfer.type]}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">상태</span>
              <Badge className={cn(STATUS_COLORS[transfer.status])} role="status">
                {TRANSFER_STATUS_LABELS[transfer.status]}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">요청일</span>
              <span>{format(new Date(transfer.requestedDate), 'yyyy-MM-dd', { locale: ko })}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">발령 예정일</span>
              <span className="font-medium">{format(new Date(transfer.effectiveDate), 'yyyy-MM-dd', { locale: ko })}</span>
            </div>
            {transfer.returnDate && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">복귀 예정일</span>
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
              대상 직원
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">이름</span>
              <span className="font-medium">{transfer.employeeName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">사번</span>
              <span className="font-mono">{transfer.employeeNumber}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">현재 부서</span>
              <span>{transfer.currentDepartment}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">현재 직책</span>
              <span>{transfer.currentPosition}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">현재 직급</span>
              <span>{transfer.currentGrade}</span>
            </div>
          </CardContent>
        </Card>

        {/* Source Tenant */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" aria-hidden="true" />
              전출 테넌트 (현재)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">테넌트</span>
              <span className="font-medium">{transfer.sourceTenantName}</span>
            </div>
            {transfer.sourceDepartmentName && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">부서</span>
                <span>{transfer.sourceDepartmentName}</span>
              </div>
            )}
            {transfer.sourceApprovedAt && (
              <>
                <div className="border-t pt-4 mt-4">
                  <p className="text-sm font-medium text-green-600">전출 승인됨</p>
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
              전입 테넌트 (목표)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">테넌트</span>
              <span className="font-medium">{transfer.targetTenantName}</span>
            </div>
            {transfer.targetDepartmentName && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">부서</span>
                <span>{transfer.targetDepartmentName}</span>
              </div>
            )}
            {transfer.targetPositionName && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">직책</span>
                <span>{transfer.targetPositionName}</span>
              </div>
            )}
            {transfer.targetGradeName && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">직급</span>
                <span>{transfer.targetGradeName}</span>
              </div>
            )}
            {transfer.targetApprovedAt && (
              <>
                <div className="border-t pt-4 mt-4">
                  <p className="text-sm font-medium text-green-600">전입 승인됨</p>
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
              이동 사유
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-muted-foreground">사유</Label>
              <p className="mt-1 whitespace-pre-wrap">{transfer.reason}</p>
            </div>
            {transfer.handoverItems && (
              <div>
                <Label className="text-muted-foreground">인수인계 항목</Label>
                <p className="mt-1 whitespace-pre-wrap">{transfer.handoverItems}</p>
              </div>
            )}
            {transfer.remarks && (
              <div>
                <Label className="text-muted-foreground">비고</Label>
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
                인수인계 체크리스트
              </CardTitle>
              <CardDescription>
                완료된 항목: {handoverItems.filter((i) => i.isCompleted).length} / {handoverItems.length}
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
                        aria-label={`${item.title} 완료 처리`}
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

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>인사이동 거부</DialogTitle>
            <DialogDescription>거부 사유를 입력해주세요.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              placeholder="거부 사유를 입력하세요"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
              취소
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={rejectMutation.isPending}>
              {rejectMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
              거부
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <ConfirmDialog
        open={isCancelDialogOpen}
        onOpenChange={setIsCancelDialogOpen}
        title="인사이동 취소"
        description="정말로 이 인사이동 요청을 취소하시겠습니까?"
        confirmLabel="취소하기"
        variant="destructive"
        isLoading={cancelMutation.isPending}
        onConfirm={handleCancel}
      />
    </>
  );
}
