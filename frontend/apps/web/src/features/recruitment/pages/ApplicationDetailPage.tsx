import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { PageHeader } from '@/components/common/PageHeader';
import {
  ApplicationStatusBadge,
  InterviewStatusBadge,
  InterviewTypeBadge,
  InterviewRecommendationBadge,
} from '@/components/common/StatusBadge';
import { StageProgressBar } from '../components/StageProgressBar';
import { InterviewScheduleForm } from '../components/InterviewScheduleForm';
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
  Loader2,
  FileCheck,
  FileX,
  ArrowRight,
  UserCheck,
  Calendar,
  Download,
  Mail,
  Phone,
} from 'lucide-react';
import {
  useApplication,
  useInterviewsByApplication,
  useInterviewScores,
  useScreenApplication,
  useRejectApplication,
  useMoveToNextStage,
  useHireApplication,
  useCreateInterview,
} from '../hooks/useRecruitment';
import { useToast } from '@/hooks/useToast';
import type { ApplicationStage, CreateInterviewRequest } from '@hr-platform/shared-types';

const STAGE_OPTIONS: { value: ApplicationStage; label: string }[] = [
  { value: 'DOCUMENT', label: '서류전형' },
  { value: 'FIRST_INTERVIEW', label: '1차면접' },
  { value: 'SECOND_INTERVIEW', label: '2차면접' },
  { value: 'FINAL_INTERVIEW', label: '최종면접' },
  { value: 'OFFER', label: '오퍼' },
];

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('info');
  const [isScreenDialogOpen, setIsScreenDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isNextStageDialogOpen, setIsNextStageDialogOpen] = useState(false);
  const [isHireDialogOpen, setIsHireDialogOpen] = useState(false);
  const [isInterviewDialogOpen, setIsInterviewDialogOpen] = useState(false);

  const [screeningComment, setScreeningComment] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [nextStage, setNextStage] = useState<ApplicationStage>('FIRST_INTERVIEW');
  const [hireDate, setHireDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [hireDepartmentId, setHireDepartmentId] = useState('');

  const { data, isLoading, isError } = useApplication(id || '');
  const { data: interviewsData } = useInterviewsByApplication(id || '');

  const screenMutation = useScreenApplication();
  const rejectMutation = useRejectApplication();
  const nextStageMutation = useMoveToNextStage();
  const hireMutation = useHireApplication();
  const createInterviewMutation = useCreateInterview();

  const application = data?.data;
  const interviews = interviewsData?.data ?? [];

  const handleScreenPass = async () => {
    if (!id) return;
    try {
      await screenMutation.mutateAsync({
        id,
        data: { passed: true, comment: screeningComment || undefined },
      });
      toast({ title: '서류 심사 합격 처리되었습니다.' });
      setIsScreenDialogOpen(false);
      setScreeningComment('');
    } catch {
      toast({ title: '처리에 실패했습니다.', variant: 'destructive' });
    }
  };

  const handleReject = async () => {
    if (!id || !rejectReason) return;
    try {
      await rejectMutation.mutateAsync({ id, data: { reason: rejectReason } });
      toast({ title: '불합격 처리되었습니다.' });
      setIsRejectDialogOpen(false);
      setRejectReason('');
    } catch {
      toast({ title: '처리에 실패했습니다.', variant: 'destructive' });
    }
  };

  const handleMoveToNextStage = async () => {
    if (!id) return;
    try {
      await nextStageMutation.mutateAsync({ id, data: { stage: nextStage } });
      toast({ title: '다음 단계로 이동되었습니다.' });
      setIsNextStageDialogOpen(false);
    } catch {
      toast({ title: '처리에 실패했습니다.', variant: 'destructive' });
    }
  };

  const handleHire = async () => {
    if (!id || !hireDepartmentId || !hireDate) return;
    try {
      await hireMutation.mutateAsync({
        id,
        data: { departmentId: hireDepartmentId, hireDate },
      });
      toast({ title: '채용이 확정되었습니다.' });
      setIsHireDialogOpen(false);
    } catch {
      toast({ title: '처리에 실패했습니다.', variant: 'destructive' });
    }
  };

  const handleCreateInterview = async (data: CreateInterviewRequest) => {
    try {
      await createInterviewMutation.mutateAsync(data);
      toast({ title: '면접 일정이 등록되었습니다.' });
      setIsInterviewDialogOpen(false);
    } catch {
      toast({ title: '면접 일정 등록에 실패했습니다.', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !application) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">지원서를 찾을 수 없습니다.</p>
        <Button variant="outline" onClick={() => navigate('/recruitment/applications')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          목록으로
        </Button>
      </div>
    );
  }

  const canScreen = application.status === 'RECEIVED' || application.status === 'SCREENING';
  const canReject = !['FAILED', 'WITHDRAWN', 'HIRED'].includes(application.status);
  const canMoveNext = application.status === 'IN_PROGRESS' || application.status === 'PASSED';
  const canHire = application.currentStage === 'OFFER' && application.status === 'PASSED';
  const canScheduleInterview = ['FIRST_INTERVIEW', 'SECOND_INTERVIEW', 'FINAL_INTERVIEW'].includes(
    application.currentStage
  );

  const currentStageIndex = STAGE_OPTIONS.findIndex((s) => s.value === application.currentStage);
  const availableNextStages = STAGE_OPTIONS.slice(currentStageIndex + 1);

  return (
    <>
      <PageHeader
        title="지원서 상세"
        description={`지원번호: ${application.applicationNumber}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate('/recruitment/applications')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              목록으로
            </Button>
            {canScheduleInterview && (
              <Button variant="outline" onClick={() => setIsInterviewDialogOpen(true)}>
                <Calendar className="mr-2 h-4 w-4" />
                면접 일정
              </Button>
            )}
            {canReject && (
              <Button
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={() => setIsRejectDialogOpen(true)}
              >
                <FileX className="mr-2 h-4 w-4" />
                불합격
              </Button>
            )}
            {canScreen && (
              <Button onClick={() => setIsScreenDialogOpen(true)}>
                <FileCheck className="mr-2 h-4 w-4" />
                서류 합격
              </Button>
            )}
            {canMoveNext && availableNextStages.length > 0 && (
              <Button onClick={() => setIsNextStageDialogOpen(true)}>
                <ArrowRight className="mr-2 h-4 w-4" />
                다음 단계
              </Button>
            )}
            {canHire && (
              <Button className="bg-green-600 hover:bg-green-700" onClick={() => setIsHireDialogOpen(true)}>
                <UserCheck className="mr-2 h-4 w-4" />
                채용 확정
              </Button>
            )}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="mb-6">
            <CardContent className="pt-6">
              <StageProgressBar currentStage={application.currentStage} />
            </CardContent>
          </Card>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="info">지원자 정보</TabsTrigger>
              <TabsTrigger value="interviews">면접 ({interviews.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="info">
              <Card>
                <CardHeader>
                  <CardTitle>지원자 정보</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2 pb-4 border-b">
                    <div>
                      <Label className="text-muted-foreground">이름</Label>
                      <p className="text-sm mt-1 font-medium">{application.applicantName}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">이메일</Label>
                      <p className="text-sm mt-1 flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {application.applicantEmail}
                      </p>
                    </div>
                    {application.applicantPhone && (
                      <div>
                        <Label className="text-muted-foreground">연락처</Label>
                        <p className="text-sm mt-1 flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          {application.applicantPhone}
                        </p>
                      </div>
                    )}
                    <div>
                      <Label className="text-muted-foreground">지원일</Label>
                      <p className="text-sm mt-1">
                        {format(new Date(application.appliedAt), 'yyyy년 M월 d일 HH:mm', {
                          locale: ko,
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="pb-4 border-b">
                    <Label className="text-muted-foreground">지원 공고</Label>
                    <p className="text-sm mt-1">
                      {application.jobCode && `[${application.jobCode}] `}
                      {application.jobTitle}
                    </p>
                  </div>

                  {application.resumeFileId && (
                    <div>
                      <Label className="text-muted-foreground">이력서</Label>
                      <div className="mt-2">
                        <Button variant="outline" size="sm">
                          <Download className="mr-2 h-4 w-4" />
                          {application.resumeFileName || '이력서 다운로드'}
                        </Button>
                      </div>
                    </div>
                  )}

                  {application.coverLetter && (
                    <div>
                      <Label className="text-muted-foreground">자기소개서</Label>
                      <div className="mt-2 p-4 rounded-lg bg-muted/50 whitespace-pre-wrap text-sm">
                        {application.coverLetter}
                      </div>
                    </div>
                  )}

                  {application.screeningComment && (
                    <div>
                      <Label className="text-muted-foreground">서류 심사 의견</Label>
                      <div className="mt-2 p-4 rounded-lg bg-blue-50 text-sm">
                        <p className="text-blue-800">{application.screeningComment}</p>
                        {application.screenedByName && (
                          <p className="text-xs text-blue-600 mt-2">
                            - {application.screenedByName},{' '}
                            {application.screenedAt &&
                              format(new Date(application.screenedAt), 'M/d HH:mm')}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {application.rejectionReason && (
                    <div>
                      <Label className="text-muted-foreground">불합격 사유</Label>
                      <div className="mt-2 p-4 rounded-lg bg-red-50 text-sm text-red-800">
                        {application.rejectionReason}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="interviews">
              <Card>
                <CardHeader>
                  <CardTitle>면접 이력</CardTitle>
                </CardHeader>
                <CardContent>
                  {interviews.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      등록된 면접이 없습니다.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {interviews.map((interview) => (
                        <InterviewCard key={interview.id} interview={interview} />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>현재 상태</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-muted-foreground">진행 상태</Label>
                <div className="mt-2">
                  <ApplicationStatusBadge status={application.status} />
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">현재 단계</Label>
                <p className="text-sm mt-1">
                  {STAGE_OPTIONS.find((s) => s.value === application.currentStage)?.label}
                </p>
              </div>
              {application.statusChangedAt && (
                <div>
                  <Label className="text-muted-foreground">상태 변경일</Label>
                  <p className="text-sm mt-1">
                    {format(new Date(application.statusChangedAt), 'yyyy년 M월 d일 HH:mm', {
                      locale: ko,
                    })}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Screen Dialog */}
      <Dialog open={isScreenDialogOpen} onOpenChange={setIsScreenDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>서류 심사 합격</DialogTitle>
            <DialogDescription>
              {application.applicantName}님의 서류 심사를 합격 처리하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>심사 의견 (선택)</Label>
            <Textarea
              className="mt-2"
              value={screeningComment}
              onChange={(e) => setScreeningComment(e.target.value)}
              placeholder="서류 심사 의견을 입력하세요."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsScreenDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleScreenPass} disabled={screenMutation.isPending}>
              {screenMutation.isPending ? '처리 중...' : '합격 처리'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>불합격 처리</DialogTitle>
            <DialogDescription>
              {application.applicantName}님을 불합격 처리하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>불합격 사유 *</Label>
            <Textarea
              className="mt-2"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="불합격 사유를 입력하세요."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectReason || rejectMutation.isPending}
            >
              {rejectMutation.isPending ? '처리 중...' : '불합격 처리'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Next Stage Dialog */}
      <Dialog open={isNextStageDialogOpen} onOpenChange={setIsNextStageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>다음 단계로 이동</DialogTitle>
            <DialogDescription>진행할 다음 단계를 선택하세요.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>다음 단계</Label>
            <select
              className="w-full h-10 mt-2 rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={nextStage}
              onChange={(e) => setNextStage(e.target.value as ApplicationStage)}
            >
              {availableNextStages.map((stage) => (
                <option key={stage.value} value={stage.value}>
                  {stage.label}
                </option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNextStageDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleMoveToNextStage} disabled={nextStageMutation.isPending}>
              {nextStageMutation.isPending ? '처리 중...' : '이동'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hire Dialog */}
      <Dialog open={isHireDialogOpen} onOpenChange={setIsHireDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>채용 확정</DialogTitle>
            <DialogDescription>
              {application.applicantName}님의 채용을 확정합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label>입사일 *</Label>
              <input
                type="date"
                className="w-full h-10 mt-2 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={hireDate}
                onChange={(e) => setHireDate(e.target.value)}
              />
            </div>
            <div>
              <Label>배치 부서 *</Label>
              <select
                className="w-full h-10 mt-2 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={hireDepartmentId}
                onChange={(e) => setHireDepartmentId(e.target.value)}
              >
                <option value="">선택</option>
                <option value="dept-001">개발팀</option>
                <option value="dept-002">인사팀</option>
                <option value="dept-003">재무팀</option>
                <option value="dept-004">마케팅팀</option>
                <option value="dept-005">디자인팀</option>
                <option value="dept-006">영업팀</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsHireDialogOpen(false)}>
              취소
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={handleHire}
              disabled={!hireDepartmentId || !hireDate || hireMutation.isPending}
            >
              {hireMutation.isPending ? '처리 중...' : '채용 확정'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Interview Schedule Dialog */}
      <Dialog open={isInterviewDialogOpen} onOpenChange={setIsInterviewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>면접 일정 등록</DialogTitle>
          </DialogHeader>
          <InterviewScheduleForm
            applicationId={id || ''}
            applicantName={application.applicantName}
            onSubmit={handleCreateInterview}
            onCancel={() => setIsInterviewDialogOpen(false)}
            isSubmitting={createInterviewMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

function InterviewCard({ interview }: { interview: any }) {
  const { data: scoresData } = useInterviewScores(interview.id);
  const scores = scoresData?.data ?? [];

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <InterviewTypeBadge type={interview.interviewType} />
          <InterviewStatusBadge status={interview.status} />
        </div>
        {interview.averageScore && (
          <span className="text-sm font-medium">평균 {interview.averageScore.toFixed(1)}점</span>
        )}
      </div>
      <div className="grid gap-2 text-sm">
        <div>
          <span className="text-muted-foreground">일시: </span>
          {format(new Date(interview.scheduledAt), 'yyyy년 M월 d일 HH:mm', { locale: ko })}
          <span className="text-muted-foreground"> ({interview.durationMinutes}분)</span>
        </div>
        {interview.location && (
          <div>
            <span className="text-muted-foreground">장소: </span>
            {interview.location}
          </div>
        )}
        {interview.interviewerNames && interview.interviewerNames.length > 0 && (
          <div>
            <span className="text-muted-foreground">면접관: </span>
            {interview.interviewerNames.join(', ')}
          </div>
        )}
      </div>
      {scores.length > 0 && (
        <div className="pt-2 border-t">
          <p className="text-sm font-medium mb-2">평가 결과</p>
          <div className="space-y-2">
            {scores.map((score: any) => (
              <div key={score.id} className="flex items-center justify-between text-sm">
                <span>{score.interviewerName}</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{score.overallScore}점</span>
                  <InterviewRecommendationBadge recommendation={score.recommendation} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
