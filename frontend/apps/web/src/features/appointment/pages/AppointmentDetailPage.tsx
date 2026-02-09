import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Send,
  PlayCircle,
  XCircle,
  MoreVertical,
  Plus,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { SkeletonCard } from '@/components/common/Skeleton';
import { AppointmentDraftStatusBadge } from '@/components/common/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/useToast';
import { AppointmentDetailForm, AppointmentDetailTable } from '../components';
import {
  useAppointmentDraft,
  useDeleteDraft,
  useAddDetail,
  useRemoveDetail,
  useSubmitDraft,
  useExecuteDraft,
  useCancelDraft,
} from '../hooks/useAppointments';
import type { CreateAppointmentDetailRequest, AppointmentType } from '@hr-platform/shared-types';

interface InfoRowProps {
  label: string;
  value: React.ReactNode;
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="flex py-2 border-b last:border-b-0">
      <dt className="w-28 flex-shrink-0 text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm">{value || '-'}</dd>
    </div>
  );
}

export default function AppointmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('appointment');
  const { toast } = useToast();
  const { data, isLoading, isError } = useAppointmentDraft(id!);

  const deleteMutation = useDeleteDraft();
  const addDetailMutation = useAddDetail();
  const removeDetailMutation = useRemoveDetail();
  const submitMutation = useSubmitDraft();
  const executeMutation = useExecuteDraft();
  const cancelMutation = useCancelDraft();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isDetailFormOpen, setIsDetailFormOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const draft = data?.data;
  const details = draft?.details ?? [];

  const isEditable = draft?.status === 'DRAFT';
  const canSubmit = draft?.status === 'DRAFT' && details.length > 0;
  const canExecute = draft?.status === 'APPROVED';
  const canCancel = ['DRAFT', 'PENDING_APPROVAL', 'APPROVED'].includes(draft?.status || '');

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast({
        title: t('detailToast.deleteSuccess'),
        description: t('detailToast.deleteSuccessDesc'),
      });
      navigate('/appointments');
    } catch {
      toast({
        title: t('detailToast.deleteFailed'),
        description: t('detailToast.deleteFailedDesc'),
        variant: 'destructive',
      });
    }
  };

  interface DetailFormData {
    employeeId: string;
    appointmentType: string;
    toDepartmentId?: string;
    toPositionCode?: string;
    toGradeCode?: string;
    toJobCode?: string;
    reason?: string;
  }

  const handleAddDetail = async (formData: DetailFormData) => {
    if (!id) return;
    const data: CreateAppointmentDetailRequest = {
      ...formData,
      appointmentType: formData.appointmentType as AppointmentType,
    };
    try {
      await addDetailMutation.mutateAsync({ draftId: id, data });
      toast({
        title: t('detailToast.addTargetSuccess'),
        description: t('detailToast.addTargetSuccessDesc'),
      });
    } catch {
      toast({
        title: t('detailToast.addTargetFailed'),
        description: t('detailToast.addTargetFailedDesc'),
        variant: 'destructive',
      });
    }
  };

  const handleRemoveDetail = async (detailId: string) => {
    if (!id) return;
    try {
      await removeDetailMutation.mutateAsync({ draftId: id, detailId });
      toast({
        title: t('detailToast.removeTargetSuccess'),
        description: t('detailToast.removeTargetSuccessDesc'),
      });
    } catch {
      toast({
        title: t('detailToast.removeTargetFailed'),
        description: t('detailToast.removeTargetFailedDesc'),
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async () => {
    if (!id) return;
    try {
      await submitMutation.mutateAsync(id);
      toast({
        title: t('detailToast.submitSuccess'),
        description: t('detailToast.submitSuccessDesc'),
      });
    } catch {
      toast({
        title: t('detailToast.submitFailed'),
        description: t('detailToast.submitFailedDesc'),
        variant: 'destructive',
      });
    }
  };

  const handleExecute = async () => {
    if (!id) return;
    try {
      await executeMutation.mutateAsync(id);
      toast({
        title: t('detailToast.executeSuccess'),
        description: t('detailToast.executeSuccessDesc'),
      });
    } catch {
      toast({
        title: t('detailToast.executeFailed'),
        description: t('detailToast.executeFailedDesc'),
        variant: 'destructive',
      });
    }
  };

  const handleCancel = async () => {
    if (!id || !cancelReason) return;
    try {
      await cancelMutation.mutateAsync({ draftId: id, data: { reason: cancelReason } });
      toast({
        title: t('detailToast.cancelSuccess'),
        description: t('detailToast.cancelSuccessDesc'),
      });
      setIsCancelDialogOpen(false);
      setCancelReason('');
    } catch {
      toast({
        title: t('detailToast.cancelFailed'),
        description: t('detailToast.cancelFailedDesc'),
        variant: 'destructive',
      });
    }
  };

  const isMutating =
    deleteMutation.isPending ||
    addDetailMutation.isPending ||
    removeDetailMutation.isPending ||
    submitMutation.isPending ||
    executeMutation.isPending ||
    cancelMutation.isPending;

  if (isLoading) {
    return (
      <>
        <PageHeader
          title={t('detailPage.title')}
          description={t('detailPage.loadingDesc')}
          actions={
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('goToList')}
            </Button>
          }
        />
        <div className="grid gap-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </>
    );
  }

  if (isError || !draft) {
    return (
      <>
        <PageHeader
          title={t('detailPage.title')}
          description={t('detailPage.notFound')}
          actions={
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('goToList')}
            </Button>
          }
        />
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">{t('detailPage.notFoundDesc')}</p>
            <Button variant="outline" onClick={() => navigate('/appointments')} className="mt-4">
              {t('detailPage.goToListFull')}
            </Button>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={draft.draftNumber}
        description={draft.title}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/appointments')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('goToList')}
            </Button>
            {isEditable && (
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                {t('detailActions.edit')}
              </Button>
            )}
            {canSubmit && (
              <Button onClick={handleSubmit} disabled={isMutating}>
                <Send className="mr-2 h-4 w-4" />
                {t('detailActions.requestApproval')}
              </Button>
            )}
            {canExecute && (
              <Button onClick={handleExecute} disabled={isMutating}>
                <PlayCircle className="mr-2 h-4 w-4" />
                {t('detailActions.execute')}
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canCancel && (
                  <DropdownMenuItem onClick={() => setIsCancelDialogOpen(true)}>
                    <XCircle className="mr-2 h-4 w-4" />
                    {t('detailActions.cancel')}
                  </DropdownMenuItem>
                )}
                {isEditable && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => setIsDeleteDialogOpen(true)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {t('detailActions.delete')}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      />

      <div className="grid gap-6">
        {/* Basic Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>{t('detailInfo.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 md:grid-cols-2">
              <div>
                <InfoRow label={t('detailInfo.appointmentNumber')} value={draft.draftNumber} />
                <InfoRow label={t('detailInfo.subject')} value={draft.title} />
                <InfoRow
                  label={t('detailInfo.effectiveDate')}
                  value={format(new Date(draft.effectiveDate), 'yyyy년 M월 d일', { locale: ko })}
                />
                <InfoRow label={t('detailInfo.description')} value={draft.description} />
              </div>
              <div>
                <InfoRow
                  label={t('detailInfo.status')}
                  value={<AppointmentDraftStatusBadge status={draft.status} />}
                />
                <InfoRow label={t('detailInfo.drafter')} value={draft.draftCreatedBy?.name} />
                <InfoRow
                  label={t('detailInfo.createdAt')}
                  value={format(new Date(draft.createdAt), 'yyyy-MM-dd HH:mm', { locale: ko })}
                />
                {draft.approvedAt && (
                  <InfoRow
                    label={t('detailInfo.approvedAt')}
                    value={format(new Date(draft.approvedAt), 'yyyy-MM-dd HH:mm', { locale: ko })}
                  />
                )}
                {draft.executedAt && (
                  <InfoRow
                    label={t('detailInfo.executedAt')}
                    value={format(new Date(draft.executedAt), 'yyyy-MM-dd HH:mm', { locale: ko })}
                  />
                )}
                {draft.cancelReason && (
                  <>
                    <InfoRow
                      label={t('detailInfo.cancelledAt')}
                      value={
                        draft.cancelledAt
                          ? format(new Date(draft.cancelledAt), 'yyyy-MM-dd HH:mm', { locale: ko })
                          : '-'
                      }
                    />
                    <InfoRow label={t('detailInfo.cancelReason')} value={draft.cancelReason} />
                  </>
                )}
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Details Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t('detailTarget.title')}</CardTitle>
                <CardDescription>{t('detailTarget.count', { count: details.length })}</CardDescription>
              </div>
              {isEditable && (
                <Button onClick={() => setIsDetailFormOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('detailTarget.addEmployee')}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <AppointmentDetailTable
              details={details}
              onRemove={isEditable ? handleRemoveDetail : undefined}
              isEditable={isEditable}
              isLoading={isMutating}
            />
          </CardContent>
        </Card>
      </div>

      {/* Add Detail Dialog */}
      <AppointmentDetailForm
        open={isDetailFormOpen}
        onOpenChange={setIsDetailFormOpen}
        onSubmit={handleAddDetail}
        isLoading={isMutating}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title={t('deleteDialog.title')}
        description={t('deleteDialog.description', { title: draft.title })}
        confirmLabel={t('deleteDialog.confirm')}
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
      />

      {/* Cancel Confirmation Dialog */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('cancelDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('cancelDialog.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="cancelReason">{t('cancelDialog.reasonLabel')}</Label>
            <Textarea
              id="cancelReason"
              placeholder={t('cancelDialog.reasonPlaceholder')}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCancelDialogOpen(false)}>
              {t('cancelDialog.close')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={!cancelReason || cancelMutation.isPending}
            >
              {cancelMutation.isPending ? t('cancelDialog.cancelling') : t('cancelDialog.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
