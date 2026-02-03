import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Check, X, Loader2, AlertTriangle } from 'lucide-react';
import { useApprove, useReject, useCancel } from '../hooks/useApprovals';

const rejectSchema = z.object({
  comment: z.string().min(1, '반려 사유를 입력해주세요'),
});

type RejectFormData = z.infer<typeof rejectSchema>;

export interface ApprovalActionsProps {
  approvalId: string;
  canApprove?: boolean;
  canReject?: boolean;
  canCancel?: boolean;
  onSuccess?: () => void;
  className?: string;
}

export function ApprovalActions({
  approvalId,
  canApprove = false,
  canReject = false,
  canCancel = false,
  onSuccess,
  className,
}: ApprovalActionsProps) {
  const [approveDialogOpen, setApproveDialogOpen] = React.useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = React.useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = React.useState(false);
  const [approveComment, setApproveComment] = React.useState('');

  const approveMutation = useApprove();
  const rejectMutation = useReject();
  const cancelMutation = useCancel();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RejectFormData>({
    resolver: zodResolver(rejectSchema),
  });

  const handleApprove = async () => {
    try {
      await approveMutation.mutateAsync({
        id: approvalId,
        data: approveComment ? { comment: approveComment } : undefined,
      });
      setApproveDialogOpen(false);
      setApproveComment('');
      onSuccess?.();
    } catch (error) {
      console.error('Approve failed:', error);
    }
  };

  const handleReject = async (data: RejectFormData) => {
    try {
      await rejectMutation.mutateAsync({
        id: approvalId,
        data: { comment: data.comment },
      });
      setRejectDialogOpen(false);
      reset();
      onSuccess?.();
    } catch (error) {
      console.error('Reject failed:', error);
    }
  };

  const handleCancel = async () => {
    try {
      await cancelMutation.mutateAsync(approvalId);
      setCancelDialogOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error('Cancel failed:', error);
    }
  };

  if (!canApprove && !canReject && !canCancel) {
    return null;
  }

  return (
    <div className={className}>
      <div className="flex gap-2">
        {canApprove && (
          <Button onClick={() => setApproveDialogOpen(true)}>
            <Check className="mr-2 h-4 w-4" />
            승인
          </Button>
        )}
        {canReject && (
          <Button variant="destructive" onClick={() => setRejectDialogOpen(true)}>
            <X className="mr-2 h-4 w-4" />
            반려
          </Button>
        )}
        {canCancel && (
          <Button variant="outline" onClick={() => setCancelDialogOpen(true)}>
            취소
          </Button>
        )}
      </div>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>결재 승인</DialogTitle>
            <DialogDescription>
              이 결재를 승인하시겠습니까? 필요시 의견을 추가할 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="의견 (선택사항)"
            value={approveComment}
            onChange={(e) => setApproveComment(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleApprove} disabled={approveMutation.isPending}>
              {approveMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  처리 중...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  승인
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>결재 반려</DialogTitle>
            <DialogDescription>
              이 결재를 반려하시겠습니까? 반려 사유를 입력해주세요.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(handleReject)}>
            <Textarea
              {...register('comment')}
              placeholder="반려 사유 (필수)"
              rows={3}
            />
            {errors.comment && (
              <p className="mt-1 text-sm text-destructive">
                {errors.comment.message}
              </p>
            )}
            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setRejectDialogOpen(false)}
              >
                취소
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={rejectMutation.isPending}
              >
                {rejectMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    처리 중...
                  </>
                ) : (
                  <>
                    <X className="mr-2 h-4 w-4" />
                    반려
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              결재 취소
            </DialogTitle>
            <DialogDescription>
              이 결재를 취소하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              아니오
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  처리 중...
                </>
              ) : (
                '예, 취소합니다'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
