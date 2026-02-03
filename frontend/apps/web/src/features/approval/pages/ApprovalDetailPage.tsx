import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { PageHeader } from '@/components/common/PageHeader';
import { ApprovalStatusBadge } from '@/components/common/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ArrowLeft, Check, X, Loader2, AlertCircle } from 'lucide-react';
import { ApprovalLine } from '../components/ApprovalLine';
import { useApproval, useApprove, useReject, useCancel } from '../hooks/useApprovals';
import type { ApprovalType } from '@hr-platform/shared-types';

const APPROVAL_TYPE_LABELS: Record<ApprovalType, string> = {
  LEAVE_REQUEST: '휴가신청',
  EXPENSE: '경비청구',
  OVERTIME: '초과근무',
  PERSONNEL: '인사관련',
  GENERAL: '일반기안',
};

export default function ApprovalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [comment, setComment] = useState('');

  const { data, isLoading, isError } = useApproval(id || '');
  const approveMutation = useApprove();
  const rejectMutation = useReject();
  const cancelMutation = useCancel();

  const approval = data?.data;

  const handleApprove = async () => {
    if (!id) return;
    try {
      await approveMutation.mutateAsync({ id, data: { comment: comment || undefined } });
      setIsApproveDialogOpen(false);
      setComment('');
    } catch (error) {
      console.error('Approve failed:', error);
    }
  };

  const handleReject = async () => {
    if (!id || !comment) return;
    try {
      await rejectMutation.mutateAsync({ id, data: { comment } });
      setIsRejectDialogOpen(false);
      setComment('');
    } catch (error) {
      console.error('Reject failed:', error);
    }
  };

  const handleCancel = async () => {
    if (!id) return;
    try {
      await cancelMutation.mutateAsync(id);
      setIsCancelDialogOpen(false);
      navigate('/approvals');
    } catch (error) {
      console.error('Cancel failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !approval) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">결재 문서를 찾을 수 없습니다.</p>
        <Button variant="outline" onClick={() => navigate('/approvals')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          목록으로
        </Button>
      </div>
    );
  }

  const canApproveOrReject = approval.status === 'PENDING';
  const canCancel = ['DRAFT', 'PENDING'].includes(approval.status);

  return (
    <>
      <PageHeader
        title="결재 문서 상세"
        description={`문서 번호: ${approval.documentNumber}`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/approvals')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              목록으로
            </Button>
            {canCancel && (
              <Button variant="outline" onClick={() => setIsCancelDialogOpen(true)}>
                취소
              </Button>
            )}
            {canApproveOrReject && (
              <>
                <Button
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setIsRejectDialogOpen(true)}
                >
                  <X className="mr-2 h-4 w-4" />
                  반려
                </Button>
                <Button onClick={() => setIsApproveDialogOpen(true)}>
                  <Check className="mr-2 h-4 w-4" />
                  승인
                </Button>
              </>
            )}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle>{approval.title}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {APPROVAL_TYPE_LABELS[approval.type]}
                {approval.urgency === 'HIGH' && (
                  <span className="ml-2 text-red-500">
                    <AlertCircle className="inline h-4 w-4 mr-1" />
                    긴급
                  </span>
                )}
              </p>
            </div>
            <ApprovalStatusBadge status={approval.status} />
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Document Info */}
              <div className="grid gap-4 md:grid-cols-2 pb-4 border-b">
                <div>
                  <Label className="text-muted-foreground">기안자</Label>
                  <p className="text-sm mt-1">
                    {approval.requesterName} ({approval.requesterDepartment})
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">기안일</Label>
                  <p className="text-sm mt-1">
                    {format(new Date(approval.createdAt), 'yyyy년 M월 d일 HH:mm', { locale: ko })}
                  </p>
                </div>
                {approval.dueDate && (
                  <div>
                    <Label className="text-muted-foreground">처리기한</Label>
                    <p className="text-sm mt-1">
                      {format(new Date(approval.dueDate), 'yyyy년 M월 d일', { locale: ko })}
                    </p>
                  </div>
                )}
                {approval.completedAt && (
                  <div>
                    <Label className="text-muted-foreground">완료일</Label>
                    <p className="text-sm mt-1">
                      {format(new Date(approval.completedAt), 'yyyy년 M월 d일 HH:mm', { locale: ko })}
                    </p>
                  </div>
                )}
              </div>

              {/* Document Content */}
              <div>
                <Label className="text-muted-foreground">문서 내용</Label>
                <div className="mt-2 p-4 rounded-lg bg-muted/50 whitespace-pre-wrap text-sm">
                  {approval.content}
                </div>
              </div>

              {/* Attachments */}
              {approval.attachments && approval.attachments.length > 0 && (
                <div>
                  <Label className="text-muted-foreground">첨부파일</Label>
                  <div className="mt-2 space-y-2">
                    {approval.attachments.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-2 rounded border"
                      >
                        <span className="text-sm">{file.fileName}</span>
                        <span className="text-xs text-muted-foreground">
                          {(file.fileSize / 1024).toFixed(1)} KB
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>결재선</CardTitle>
            </CardHeader>
            <CardContent>
              <ApprovalLine
                steps={approval.steps}
                requesterName={approval.requesterName}
              />
            </CardContent>
          </Card>

          {/* Approval History */}
          <Card>
            <CardHeader>
              <CardTitle>결재 이력</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3 text-sm">
                  <div className="w-20 text-muted-foreground">
                    {format(new Date(approval.createdAt), 'M/d HH:mm')}
                  </div>
                  <div>
                    <span className="font-medium">{approval.requesterName}</span>
                    님이 기안
                  </div>
                </div>
                {approval.steps
                  .filter(step => step.processedAt)
                  .map((step) => (
                    <div key={step.id} className="flex items-start gap-3 text-sm">
                      <div className="w-20 text-muted-foreground">
                        {format(new Date(step.processedAt!), 'M/d HH:mm')}
                      </div>
                      <div>
                        <span className="font-medium">{step.approverName}</span>
                        님이{' '}
                        <span className={step.status === 'APPROVED' ? 'text-green-600' : 'text-red-600'}>
                          {step.status === 'APPROVED' ? '승인' : '반려'}
                        </span>
                        {step.comment && (
                          <p className="text-muted-foreground mt-1">"{step.comment}"</p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Approve Dialog */}
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>결재 승인</DialogTitle>
            <DialogDescription>
              이 문서를 승인하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>의견 (선택)</Label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="승인 의견을 입력하세요."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleApprove} disabled={approveMutation.isPending}>
              {approveMutation.isPending ? '처리 중...' : '승인'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>결재 반려</DialogTitle>
            <DialogDescription>
              이 문서를 반려하시겠습니까? 반려 사유를 입력해주세요.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>반려 사유 *</Label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="반려 사유를 입력하세요."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!comment || rejectMutation.isPending}
            >
              {rejectMutation.isPending ? '처리 중...' : '반려'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>결재 취소</DialogTitle>
            <DialogDescription>
              정말로 이 결재를 취소하시겠습니까?
              <br />
              <span className="text-destructive">이 작업은 되돌릴 수 없습니다.</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCancelDialogOpen(false)}>
              닫기
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? '처리 중...' : '취소하기'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
