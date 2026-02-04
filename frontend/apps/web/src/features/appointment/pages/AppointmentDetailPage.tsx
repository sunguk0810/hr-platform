import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
        title: '삭제 완료',
        description: '발령안이 삭제되었습니다.',
      });
      navigate('/appointments');
    } catch {
      toast({
        title: '삭제 실패',
        description: '발령안 삭제 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  interface DetailFormData {
    employeeId: string;
    appointmentType: string;
    toDepartmentId?: string;
    toPositionId?: string;
    toGradeId?: string;
    toJobId?: string;
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
        title: '대상 추가',
        description: '발령 대상이 추가되었습니다.',
      });
    } catch {
      toast({
        title: '추가 실패',
        description: '발령 대상 추가 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveDetail = async (detailId: string) => {
    if (!id) return;
    try {
      await removeDetailMutation.mutateAsync({ draftId: id, detailId });
      toast({
        title: '대상 삭제',
        description: '발령 대상이 삭제되었습니다.',
      });
    } catch {
      toast({
        title: '삭제 실패',
        description: '발령 대상 삭제 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async () => {
    if (!id) return;
    try {
      await submitMutation.mutateAsync(id);
      toast({
        title: '결재 요청 완료',
        description: '발령안이 결재 요청되었습니다.',
      });
    } catch {
      toast({
        title: '결재 요청 실패',
        description: '결재 요청 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleExecute = async () => {
    if (!id) return;
    try {
      await executeMutation.mutateAsync(id);
      toast({
        title: '시행 완료',
        description: '발령이 시행되었습니다.',
      });
    } catch {
      toast({
        title: '시행 실패',
        description: '발령 시행 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleCancel = async () => {
    if (!id || !cancelReason) return;
    try {
      await cancelMutation.mutateAsync({ draftId: id, data: { reason: cancelReason } });
      toast({
        title: '취소 완료',
        description: '발령안이 취소되었습니다.',
      });
      setIsCancelDialogOpen(false);
      setCancelReason('');
    } catch {
      toast({
        title: '취소 실패',
        description: '발령 취소 중 오류가 발생했습니다.',
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
          title="발령안 상세"
          description="로딩 중..."
          actions={
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              목록으로
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
          title="발령안 상세"
          description="발령안을 찾을 수 없습니다."
          actions={
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              목록으로
            </Button>
          }
        />
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">요청한 발령안을 찾을 수 없습니다.</p>
            <Button variant="outline" onClick={() => navigate('/appointments')} className="mt-4">
              목록으로 돌아가기
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
              목록으로
            </Button>
            {isEditable && (
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                수정
              </Button>
            )}
            {canSubmit && (
              <Button onClick={handleSubmit} disabled={isMutating}>
                <Send className="mr-2 h-4 w-4" />
                결재요청
              </Button>
            )}
            {canExecute && (
              <Button onClick={handleExecute} disabled={isMutating}>
                <PlayCircle className="mr-2 h-4 w-4" />
                시행
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
                    취소
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
                      삭제
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
            <CardTitle>기본 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 md:grid-cols-2">
              <div>
                <InfoRow label="발령번호" value={draft.draftNumber} />
                <InfoRow label="제목" value={draft.title} />
                <InfoRow
                  label="시행일"
                  value={format(new Date(draft.effectiveDate), 'yyyy년 M월 d일', { locale: ko })}
                />
                <InfoRow label="설명" value={draft.description} />
              </div>
              <div>
                <InfoRow
                  label="상태"
                  value={<AppointmentDraftStatusBadge status={draft.status} />}
                />
                <InfoRow label="기안자" value={draft.draftCreatedBy.name} />
                <InfoRow
                  label="생성일"
                  value={format(new Date(draft.createdAt), 'yyyy-MM-dd HH:mm', { locale: ko })}
                />
                {draft.approvedAt && (
                  <InfoRow
                    label="승인일"
                    value={format(new Date(draft.approvedAt), 'yyyy-MM-dd HH:mm', { locale: ko })}
                  />
                )}
                {draft.executedAt && (
                  <InfoRow
                    label="시행일시"
                    value={format(new Date(draft.executedAt), 'yyyy-MM-dd HH:mm', { locale: ko })}
                  />
                )}
                {draft.cancelReason && (
                  <>
                    <InfoRow
                      label="취소일"
                      value={
                        draft.cancelledAt
                          ? format(new Date(draft.cancelledAt), 'yyyy-MM-dd HH:mm', { locale: ko })
                          : '-'
                      }
                    />
                    <InfoRow label="취소사유" value={draft.cancelReason} />
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
                <CardTitle>발령 대상</CardTitle>
                <CardDescription>{details.length}명</CardDescription>
              </div>
              {isEditable && (
                <Button onClick={() => setIsDetailFormOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  직원 추가
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
        title="발령안 삭제"
        description={`정말로 "${draft.title}" 발령안을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        confirmLabel="삭제"
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
      />

      {/* Cancel Confirmation Dialog */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>발령안 취소</DialogTitle>
            <DialogDescription>
              발령안을 취소합니다. 취소 사유를 입력해주세요.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="cancelReason">취소 사유 *</Label>
            <Textarea
              id="cancelReason"
              placeholder="취소 사유를 입력하세요"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCancelDialogOpen(false)}>
              닫기
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={!cancelReason || cancelMutation.isPending}
            >
              {cancelMutation.isPending ? '취소 중...' : '취소'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
