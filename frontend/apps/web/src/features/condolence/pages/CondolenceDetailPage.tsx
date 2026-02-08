import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
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
        title: '승인 완료',
        description: '경조비 신청이 승인되었습니다.',
      });
    } catch {
      toast({
        title: '승인 실패',
        description: '경조비 승인 중 오류가 발생했습니다.',
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
        title: '반려 완료',
        description: '경조비 신청이 반려되었습니다.',
      });
    } catch {
      toast({
        title: '반려 실패',
        description: '경조비 반려 중 오류가 발생했습니다.',
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
        title: '취소 완료',
        description: '경조비 신청이 취소되었습니다.',
      });
      navigate('/condolence');
    } catch {
      toast({
        title: '취소 실패',
        description: '경조비 취소 중 오류가 발생했습니다.',
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
        title: '삭제 완료',
        description: '경조비 신청이 삭제되었습니다.',
      });
      navigate('/condolence');
    } catch {
      toast({
        title: '삭제 실패',
        description: '경조비 삭제 중 오류가 발생했습니다.',
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
        <p className="text-muted-foreground">경조비 신청을 찾을 수 없습니다.</p>
        <Button variant="outline" onClick={() => navigate('/condolence')}>
          목록으로
        </Button>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="경조비 상세"
        description={`요청번호: ${request.requestNumber}`}
        actions={
          <div className="flex gap-2">
            {canEdit && (
              <Button variant="outline" onClick={() => navigate(`/condolence/${id}/edit`)}>
                수정
              </Button>
            )}
            {canCancel && (
              <Button variant="outline" onClick={() => setCancelDialogOpen(true)}>
                취소
              </Button>
            )}
            {canDelete && (
              <Button
                variant="outline"
                className="text-destructive"
                onClick={() => setDeleteDialogOpen(true)}
              >
                삭제
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
                경조비 신청 정보
              </CardTitle>
              <Badge className={cn(STATUS_COLORS[request.status])}>
                {CONDOLENCE_STATUS_LABELS[request.status]}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Employee Info */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">신청자 정보</h3>
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
                    <p className="text-sm text-muted-foreground">소속 부서</p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Event Info */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">경조 내용</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">경조 유형</p>
                  <p className="font-medium">{CONDOLENCE_TYPE_LABELS[request.eventType]}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">발생일</p>
                  <p className="font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(request.eventDate), 'yyyy년 M월 d일 (EEE)', { locale: ko })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">대상자</p>
                  <p className="font-medium">{request.relatedPersonName || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">대상자 관계</p>
                  <p className="font-medium">{request.relation || '-'}</p>
                </div>
              </div>
              {request.description && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground">비고</p>
                  <p className="font-medium mt-1">{request.description}</p>
                </div>
              )}
            </div>

            <Separator />

            {/* Amount */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">경조금</h3>
              <div className="text-3xl font-bold text-primary">
                {request.amount.toLocaleString()}원
              </div>
            </div>

            {/* Attachments */}
            {request.attachments && request.attachments.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">첨부 서류</h3>
                  <div className="space-y-2">
                    {request.attachments.map((_fileId, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">첨부파일 {index + 1}</span>
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
              <CardTitle className="text-base">처리 현황</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">신청 완료</p>
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
                      <p className="font-medium">승인 완료</p>
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
                      <p className="font-medium">반려</p>
                      <p className="text-sm text-muted-foreground">{request.rejectReason}</p>
                    </div>
                  </div>
                ) : request.status === 'CANCELLED' ? (
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600">
                      <XCircle className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">신청 취소</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100 text-yellow-600">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">승인 대기</p>
                      <p className="text-sm text-muted-foreground">관리자 검토 중</p>
                    </div>
                  </div>
                )}

                {request.status === 'PAID' && (
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">지급 완료</p>
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
                <CardTitle className="text-base">관리자 작업</CardTitle>
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
                  승인
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setRejectDialogOpen(true)}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  반려
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
            <DialogTitle>경조비 반려</DialogTitle>
            <DialogDescription>반려 사유를 입력해주세요.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reject-reason">반려 사유</Label>
              <Textarea
                id="reject-reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="반려 사유를 입력하세요..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectReason.trim() || rejectMutation.isPending}
            >
              {rejectMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              반려
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>신청 취소</AlertDialogTitle>
            <AlertDialogDescription>
              경조비 신청을 취소하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel}>확인</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>신청 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              경조비 신청을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
