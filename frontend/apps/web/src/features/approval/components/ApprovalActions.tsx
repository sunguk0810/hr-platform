import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
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

const createRejectSchema = (t: TFunction) => z.object({
  comment: z.string().min(1, t('approvalActions.rejectReasonValidation')),
});

type RejectFormData = z.infer<ReturnType<typeof createRejectSchema>>;

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
  const { t } = useTranslation('approval');
  const [approveDialogOpen, setApproveDialogOpen] = React.useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = React.useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = React.useState(false);
  const [approveComment, setApproveComment] = React.useState('');

  const approveMutation = useApprove();
  const rejectMutation = useReject();
  const cancelMutation = useCancel();

  const rejectSchema = React.useMemo(() => createRejectSchema(t), [t]);

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
            {t('common.approve')}
          </Button>
        )}
        {canReject && (
          <Button variant="destructive" onClick={() => setRejectDialogOpen(true)}>
            <X className="mr-2 h-4 w-4" />
            {t('common.reject')}
          </Button>
        )}
        {canCancel && (
          <Button variant="outline" onClick={() => setCancelDialogOpen(true)}>
            {t('common.cancel')}
          </Button>
        )}
      </div>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('approvalActions.approveTitle')}</DialogTitle>
            <DialogDescription>
              {t('approvalActions.approveConfirm')}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder={t('approvalActions.commentOptional')}
            value={approveComment}
            onChange={(e) => setApproveComment(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleApprove} disabled={approveMutation.isPending}>
              {approveMutation.isPending ? (
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
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('approvalActions.rejectTitle')}</DialogTitle>
            <DialogDescription>
              {t('approvalActions.rejectConfirm')}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(handleReject)}>
            <Textarea
              {...register('comment')}
              placeholder={t('approvalActions.rejectReasonRequired')}
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
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={rejectMutation.isPending}
              >
                {rejectMutation.isPending ? (
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
          </form>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              {t('approvalActions.cancelTitle')}
            </DialogTitle>
            <DialogDescription>
              {t('approvalActions.cancelConfirm')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              {t('common.no')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('common.processing')}
                </>
              ) : (
                t('common.yesCancel')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
