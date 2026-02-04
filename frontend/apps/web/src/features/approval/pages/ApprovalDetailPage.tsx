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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Check,
  X,
  Loader2,
  AlertCircle,
  Undo2,
  UserCheck,
  FastForward,
  History,
  FileText,
} from 'lucide-react';
import { ApprovalLine } from '../components/ApprovalLine';
import { ApprovalHistory } from '../components/ApprovalHistory';
import { RecallDialog } from '../components/RecallDialog';
import { DelegateDialog } from '../components/DelegateDialog';
import { DirectApproveDialog } from '../components/DirectApproveDialog';
import {
  useApproval,
  useApprove,
  useReject,
  useCancel,
  useRecall,
  useDelegate,
  useDirectApprove,
  useApprovalHistory,
} from '../hooks/useApprovals';
import type { ApprovalType } from '@hr-platform/shared-types';

const APPROVAL_TYPE_LABELS: Record<ApprovalType, string> = {
  LEAVE_REQUEST: '휴가신청',
  EXPENSE: '경비청구',
  OVERTIME: '초과근무',
  PERSONNEL: '인사관련',
  GENERAL: '일반기안',
};

// Mock 현재 사용자 ID (실제로는 auth context에서 가져옴)
const CURRENT_USER_ID = 'emp-001';

export default function ApprovalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isRecallDialogOpen, setIsRecallDialogOpen] = useState(false);
  const [isDelegateDialogOpen, setIsDelegateDialogOpen] = useState(false);
  const [isDirectApproveDialogOpen, setIsDirectApproveDialogOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [activeTab, setActiveTab] = useState('document');

  const { data, isLoading, isError } = useApproval(id || '');
  const { data: historyData, isLoading: isHistoryLoading } = useApprovalHistory(id || '');
  const approveMutation = useApprove();
  const rejectMutation = useReject();
  const cancelMutation = useCancel();
  const recallMutation = useRecall();
  const delegateMutation = useDelegate();
  const directApproveMutation = useDirectApprove();

  const approval = data?.data;
  const history = historyData?.data;

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

  const handleRecall = async (reason: string) => {
    if (!id) return;
    try {
      await recallMutation.mutateAsync({ id, data: { reason } });
      setIsRecallDialogOpen(false);
    } catch (error) {
      console.error('Recall failed:', error);
    }
  };

  const handleDelegate = async (delegateToId: string, delegateToName: string, reason?: string) => {
    if (!id || !approval) return;
    const currentStep = approval.steps.find((s) => s.status === 'PENDING');
    if (!currentStep) return;

    try {
      await delegateMutation.mutateAsync({
        id,
        stepId: currentStep.id,
        data: { delegateToId, delegateToName, reason },
      });
      setIsDelegateDialogOpen(false);
    } catch (error) {
      console.error('Delegate failed:', error);
    }
  };

  const handleDirectApprove = async (skipToStep: number | undefined, reason: string) => {
    if (!id) return;
    try {
      await directApproveMutation.mutateAsync({
        id,
        data: { skipToStep, reason },
      });
      setIsDirectApproveDialogOpen(false);
    } catch (error) {
      console.error('Direct approve failed:', error);
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

  // 권한 체크
  const isRequester = approval.requesterId === CURRENT_USER_ID;
  const currentStep = approval.steps.find((s) => s.status === 'PENDING');
  const isCurrentApprover = currentStep?.approverId === CURRENT_USER_ID;
  const currentStepOrder = currentStep?.stepOrder || 1;

  // 버튼 표시 조건
  const canApproveOrReject = approval.status === 'PENDING' && isCurrentApprover;
  const canCancel = ['DRAFT', 'PENDING'].includes(approval.status) && isRequester;
  const canRecall = approval.status === 'PENDING' && isRequester;
  const canDelegate = approval.status === 'PENDING' && isCurrentApprover;
  const canDirectApprove = approval.status === 'PENDING' && isCurrentApprover; // 실제로는 권한 체크 필요

  return (
    <>
      <PageHeader
        title="결재 문서 상세"
        description={`문서 번호: ${approval.documentNumber}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate('/approvals')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              목록으로
            </Button>
            {canRecall && (
              <Button
                variant="outline"
                onClick={() => setIsRecallDialogOpen(true)}
                className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
              >
                <Undo2 className="mr-2 h-4 w-4" />
                회수
              </Button>
            )}
            {canCancel && !canRecall && (
              <Button variant="outline" onClick={() => setIsCancelDialogOpen(true)}>
                취소
              </Button>
            )}
            {canDelegate && (
              <Button
                variant="outline"
                onClick={() => setIsDelegateDialogOpen(true)}
                className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
              >
                <UserCheck className="mr-2 h-4 w-4" />
                대결
              </Button>
            )}
            {canDirectApprove && (
              <Button
                variant="outline"
                onClick={() => setIsDirectApproveDialogOpen(true)}
                className="text-teal-600 hover:text-teal-700 hover:bg-teal-50"
              >
                <FastForward className="mr-2 h-4 w-4" />
                전결
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
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="document" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                문서 내용
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                결재 이력
              </TabsTrigger>
            </TabsList>

            <TabsContent value="document">
              <Card>
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
                      {approval.recalledAt && (
                        <div>
                          <Label className="text-muted-foreground">회수일</Label>
                          <p className="text-sm mt-1 text-orange-600">
                            {format(new Date(approval.recalledAt), 'yyyy년 M월 d일 HH:mm', { locale: ko })}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Recall Reason */}
                    {approval.recallReason && (
                      <div className="rounded-lg bg-orange-50 border border-orange-200 p-4">
                        <Label className="text-orange-700 text-sm font-medium">회수 사유</Label>
                        <p className="text-sm mt-1 text-orange-800">{approval.recallReason}</p>
                      </div>
                    )}

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
            </TabsContent>

            <TabsContent value="history">
              {isHistoryLoading ? (
                <Card>
                  <CardContent className="flex items-center justify-center h-48">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </CardContent>
                </Card>
              ) : (
                <ApprovalHistory historyData={history} />
              )}
            </TabsContent>
          </Tabs>
        </div>

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

          {/* Quick History (간략 이력) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>최근 이력</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveTab('history')}
                  className="text-xs"
                >
                  전체보기
                </Button>
              </CardTitle>
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
                  .filter((step) => step.processedAt)
                  .slice(0, 3)
                  .map((step) => (
                    <div key={step.id} className="flex items-start gap-3 text-sm">
                      <div className="w-20 text-muted-foreground">
                        {format(new Date(step.processedAt!), 'M/d HH:mm')}
                      </div>
                      <div>
                        <span className="font-medium">{step.approverName}</span>
                        님이{' '}
                        <span
                          className={
                            step.status === 'APPROVED'
                              ? 'text-green-600'
                              : step.status === 'REJECTED'
                              ? 'text-red-600'
                              : 'text-muted-foreground'
                          }
                        >
                          {step.status === 'APPROVED'
                            ? '승인'
                            : step.status === 'REJECTED'
                            ? '반려'
                            : step.status === 'SKIPPED'
                            ? '건너뜀'
                            : '대기'}
                        </span>
                        {step.delegatorName && (
                          <span className="text-xs text-indigo-600 ml-1">
                            (대결: {step.delegatorName})
                          </span>
                        )}
                        {step.directApproved && (
                          <span className="text-xs text-teal-600 ml-1">(전결)</span>
                        )}
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
            <DialogDescription>이 문서를 승인하시겠습니까?</DialogDescription>
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

      {/* Recall Dialog */}
      <RecallDialog
        open={isRecallDialogOpen}
        onOpenChange={setIsRecallDialogOpen}
        onConfirm={handleRecall}
        isLoading={recallMutation.isPending}
        documentTitle={approval.title}
      />

      {/* Delegate Dialog */}
      <DelegateDialog
        open={isDelegateDialogOpen}
        onOpenChange={setIsDelegateDialogOpen}
        onConfirm={handleDelegate}
        isLoading={delegateMutation.isPending}
        currentApproverName={currentStep?.approverName}
      />

      {/* Direct Approve Dialog */}
      <DirectApproveDialog
        open={isDirectApproveDialogOpen}
        onOpenChange={setIsDirectApproveDialogOpen}
        onConfirm={handleDirectApprove}
        isLoading={directApproveMutation.isPending}
        steps={approval.steps}
        currentStepOrder={currentStepOrder}
      />
    </>
  );
}
