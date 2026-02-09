import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Heart,
  User,
  Building2,
  Calendar,
  FileText,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/useToast';
import {
  useCondolenceRequest,
  useApproveCondolenceRequest,
  useRejectCondolenceRequest,
  useCancelCondolenceRequest,
  useDeleteCondolenceRequest,
} from '../hooks/useCondolence';
import type { CondolenceRequestStatus } from '@hr-platform/shared-types';
import { CONDOLENCE_TYPE_LABELS, CONDOLENCE_STATUS_LABELS } from '@hr-platform/shared-types';

const STATUS_COLORS: Record<CondolenceRequestStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  APPROVED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  PAID: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  CANCELLED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

const ADMIN_ROLES = ['SUPER_ADMIN', 'GROUP_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER'];

export default function CondolenceDetailPage() {
  const { t } = useTranslation('condolence');
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { user, hasAnyRole } = useAuthStore();
  const canApprove = hasAnyRole(ADMIN_ROLES);

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const { data, isLoading } = useCondolenceRequest(id || '');
  const approveMutation = useApproveCondolenceRequest();
  const rejectMutation = useRejectCondolenceRequest();
  const cancelMutation = useCancelCondolenceRequest();
  const deleteMutation = useDeleteCondolenceRequest();

  const request = data?.data;

  const isOwner = user?.id === request?.employeeId;
  const canEdit = isOwner && request?.status === 'PENDING';
  const canCancel = isOwner && request?.status === 'PENDING';
  const canDelete = isOwner && request?.status === 'PENDING';

  const handleApprove = async () => {
    if (!id) return;
    try {
      await approveMutation.mutateAsync(id);
      toast({
        title: t('detailToast.approveSuccess'),
        description: t('detailToast.approveSuccessDesc'),
      });
    } catch {
      toast({
        title: t('detailToast.approveFailed'),
        description: t('detailToast.approveFailedDesc'),
        variant: 'destructive',
      });
    }
  };

  const handleReject = async () => {
    if (!id || !rejectReason.trim()) return;
    try {
      await rejectMutation.mutateAsync({ id, reason: rejectReason });
      setRejectDialogOpen(false);
      setRejectReason('');
      toast({
        title: t('detailToast.rejectSuccess'),
        description: t('detailToast.rejectSuccessDesc'),
      });
    } catch {
      toast({
        title: t('detailToast.rejectFailed'),
        description: t('detailToast.rejectFailedDesc'),
        variant: 'destructive',
      });
    }
  };

  const handleCancel = async () => {
    if (!id) return;
    try {
      await cancelMutation.mutateAsync(id);
      setCancelDialogOpen(false);
      toast({
        title: t('detailToast.cancelSuccess'),
        description: t('detailToast.cancelSuccessDesc'),
      });
      navigate('/condolence');
    } catch {
      toast({
        title: t('detailToast.cancelFailed'),
        description: t('detailToast.cancelFailedDesc'),
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteMutation.mutateAsync(id);
      setDeleteDialogOpen(false);
      toast({
        title: t('detailToast.deleteSuccess'),
        description: t('detailToast.deleteSuccessDesc'),
      });
      navigate('/condolence');
    } catch {
      toast({
        title: t('detailToast.deleteFailed'),
        description: t('detailToast.deleteFailedDesc'),
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-muted-foreground">{t('detailPage.notFound')}</p>
        <Button variant="outline" onClick={() => navigate('/condolence')}>
          {t('goToList')}
        </Button>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title={t('detail')}
        description={`${t('requestNumber')}: ${request.requestNumber}`}
        actions={
          <div className="flex gap-2">
            {canEdit && (
              <Button variant="outline" onClick={() => navigate(`/condolence/${id}/edit`)}>
                {t('detailPage.edit')}
              </Button>
            )}
            {canCancel && (
              <Button variant="outline" onClick={() => setCancelDialogOpen(true)}>
                {t('detailPage.cancelAction')}
              </Button>
            )}
            {canDelete && (
              <Button
                variant="outline"
                className="text-destructive"
                onClick={() => setDeleteDialogOpen(true)}
              >
                {t('detailPage.deleteAction')}
              </Button>
            )}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" aria-hidden="true" />
                {t('detailPage.requestInfo')}
              </CardTitle>
              <Badge className={cn(STATUS_COLORS[request.status])}>
                {CONDOLENCE_STATUS_LABELS[request.status]}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Employee Info */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">{t('detailPage.applicantInfo')}</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">{request.employeeName}</p>
                    <p className="text-sm text-muted-foreground">{request.employeeNumber}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">{request.departmentName}</p>
                    <p className="text-sm text-muted-foreground">{t('detailPage.department')}</p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Event Info */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">{t('detailPage.eventContent')}</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">{t('detailPage.eventType')}</p>
                  <p className="font-medium">{CONDOLENCE_TYPE_LABELS[request.eventType]}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('eventDate')}</p>
                  <p className="font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(request.eventDate), 'yyyy년 M월 d일 (EEE)', { locale: ko })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('detailPage.target')}</p>
                  <p className="font-medium">{request.relatedPersonName || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('detailPage.targetRelation')}</p>
                  <p className="font-medium">{request.relation || '-'}</p>
                </div>
              </div>
              {request.description && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground">{t('detailPage.note')}</p>
                  <p className="font-medium mt-1">{request.description}</p>
                </div>
              )}
            </div>

            <Separator />

            {/* Amount */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">{t('detailPage.condolenceAmount')}</h3>
              <div className="text-3xl font-bold text-primary">
                {request.amount.toLocaleString()}원
              </div>
            </div>

            {/* Attachments */}
            {request.attachments && request.attachments.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">{t('detailPage.attachments')}</h3>
                  <div className="space-y-2">
                    {request.attachments.map((_fileId, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{t('detailPage.attachmentLabel')}{index + 1}</span>
                        </div>
                        <Button variant="ghost" size="icon">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Side Panel */}
        <div className="space-y-6">
          {/* Status Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('detailPage.processingStatus')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{t('detailTimeline.submitted')}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(request.createdAt), 'yyyy-MM-dd HH:mm')}
                    </p>
                  </div>
                </div>

                {request.status === 'APPROVED' || request.status === 'PAID' ? (
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{t('detailTimeline.approved')}</p>
                      <p className="text-sm text-muted-foreground">
                        {request.approvedAt
                          ? format(new Date(request.approvedAt), 'yyyy-MM-dd HH:mm')
                          : '-'}
                      </p>
                    </div>
                  </div>
                ) : request.status === 'REJECTED' ? (
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600">
                      <XCircle className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{t('detailTimeline.rejected')}</p>
                      <p className="text-sm text-muted-foreground">{request.rejectReason}</p>
                    </div>
                  </div>
                ) : request.status === 'CANCELLED' ? (
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600">
                      <XCircle className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{t('detailTimeline.cancelled')}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100 text-yellow-600">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{t('detailTimeline.pendingApproval')}</p>
                      <p className="text-sm text-muted-foreground">{t('detailTimeline.pendingApprovalDesc')}</p>
                    </div>
                  </div>
                )}

                {request.status === 'PAID' && (
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{t('detailTimeline.paid')}</p>
                      <p className="text-sm text-muted-foreground">
                        {request.paidDate
                          ? format(new Date(request.paidDate), 'yyyy-MM-dd HH:mm')
                          : '-'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions for Admin */}
          {canApprove && request.status === 'PENDING' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('detailPage.adminActions')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  className="w-full"
                  onClick={handleApprove}
                  disabled={approveMutation.isPending}
                >
                  {approveMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  )}
                  {t('detailActions.approve')}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setRejectDialogOpen(true)}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  {t('detailActions.reject')}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('rejectDialog.title')}</DialogTitle>
            <DialogDescription>{t('rejectDialog.description')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reject-reason">{t('rejectDialog.reasonLabel')}</Label>
              <Textarea
                id="reject-reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder={t('rejectDialog.reasonPlaceholder')}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              {t('rejectDialog.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectReason.trim() || rejectMutation.isPending}
            >
              {rejectMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('rejectDialog.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('cancelDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('cancelDialog.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancelDialog.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel}>{t('cancelDialog.confirm')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteDialog.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('deleteDialog.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('deleteDialog.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
