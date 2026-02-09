import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useIsMobile } from '@/hooks/useMediaQuery';
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
  MoreVertical,
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

export default function ApplicationDetailPage() {
  const { t } = useTranslation('recruitment');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const STAGE_OPTIONS: { value: ApplicationStage; label: string }[] = [
    { value: 'DOCUMENT', label: t('stage.document') },
    { value: 'FIRST_INTERVIEW', label: t('stage.firstInterview') },
    { value: 'SECOND_INTERVIEW', label: t('stage.secondInterview') },
    { value: 'FINAL_INTERVIEW', label: t('stage.finalInterview') },
    { value: 'OFFER', label: t('stage.offer') },
  ];

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
      toast({ title: t('application.toast.screenPassed') });
      setIsScreenDialogOpen(false);
      setScreeningComment('');
    } catch {
      toast({ title: t('application.toast.processFailed'), variant: 'destructive' });
    }
  };

  const handleReject = async () => {
    if (!id || !rejectReason) return;
    try {
      await rejectMutation.mutateAsync({ id, data: { reason: rejectReason } });
      toast({ title: t('application.toast.rejected') });
      setIsRejectDialogOpen(false);
      setRejectReason('');
    } catch {
      toast({ title: t('application.toast.processFailed'), variant: 'destructive' });
    }
  };

  const handleMoveToNextStage = async () => {
    if (!id) return;
    try {
      await nextStageMutation.mutateAsync({ id, data: { stage: nextStage } });
      toast({ title: t('application.toast.movedToNextStage') });
      setIsNextStageDialogOpen(false);
    } catch {
      toast({ title: t('application.toast.processFailed'), variant: 'destructive' });
    }
  };

  const handleHire = async () => {
    if (!id || !hireDepartmentId || !hireDate) return;
    try {
      await hireMutation.mutateAsync({
        id,
        data: { departmentId: hireDepartmentId, hireDate },
      });
      toast({ title: t('application.toast.hired') });
      setIsHireDialogOpen(false);
    } catch {
      toast({ title: t('application.toast.processFailed'), variant: 'destructive' });
    }
  };

  const handleCreateInterview = async (data: CreateInterviewRequest) => {
    try {
      await createInterviewMutation.mutateAsync(data);
      toast({ title: t('interview.toast.created') });
      setIsInterviewDialogOpen(false);
    } catch {
      toast({ title: t('interview.toast.createFailed'), variant: 'destructive' });
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
        <p className="text-muted-foreground">{t('application.notFoundMessage')}</p>
        <Button variant="outline" onClick={() => navigate('/recruitment/applications')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('common.backToList')}
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

  const renderDialogs = () => (
    <>
      {/* Screen Dialog */}
      <Dialog open={isScreenDialogOpen} onOpenChange={setIsScreenDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('application.screening.title')}</DialogTitle>
            <DialogDescription>
              {t('application.screening.confirmMessage', { name: application.applicantName })}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>{t('application.screening.commentLabel')}</Label>
            <Textarea
              className="mt-2"
              value={screeningComment}
              onChange={(e) => setScreeningComment(e.target.value)}
              placeholder={t('application.screening.commentPlaceholder')}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsScreenDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleScreenPass} disabled={screenMutation.isPending}>
              {screenMutation.isPending ? t('common.processing') : t('application.screening.passButton')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('application.rejection.title')}</DialogTitle>
            <DialogDescription>
              {t('application.rejection.confirmMessage', { name: application.applicantName })}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>{t('application.rejection.reasonLabel')}</Label>
            <Textarea
              className="mt-2"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder={t('application.rejection.reasonPlaceholder')}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectReason || rejectMutation.isPending}
            >
              {rejectMutation.isPending ? t('common.processing') : t('application.rejection.rejectButton')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Next Stage Dialog */}
      <Dialog open={isNextStageDialogOpen} onOpenChange={setIsNextStageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('application.nextStage.title')}</DialogTitle>
            <DialogDescription>{t('application.nextStage.description')}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>{t('application.nextStage.label')}</Label>
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
              {t('common.cancel')}
            </Button>
            <Button onClick={handleMoveToNextStage} disabled={nextStageMutation.isPending}>
              {nextStageMutation.isPending ? t('common.processing') : t('application.nextStage.moveButton')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hire Dialog */}
      <Dialog open={isHireDialogOpen} onOpenChange={setIsHireDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('application.hire.title')}</DialogTitle>
            <DialogDescription>
              {t('application.hire.confirmMessage', { name: application.applicantName })}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label>{t('application.hire.hireDate')}</Label>
              <input
                type="date"
                className="w-full h-10 mt-2 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={hireDate}
                onChange={(e) => setHireDate(e.target.value)}
              />
            </div>
            <div>
              <Label>{t('application.hire.department')}</Label>
              <select
                className="w-full h-10 mt-2 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={hireDepartmentId}
                onChange={(e) => setHireDepartmentId(e.target.value)}
              >
                <option value="">{t('common.select')}</option>
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
              {t('common.cancel')}
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={handleHire}
              disabled={!hireDepartmentId || !hireDate || hireMutation.isPending}
            >
              {hireMutation.isPending ? t('common.processing') : t('application.hire.confirmButton')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Interview Schedule Dialog */}
      <Dialog open={isInterviewDialogOpen} onOpenChange={setIsInterviewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('interview.scheduleRegister')}</DialogTitle>
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

  // 모바일 레이아웃
  if (isMobile) {
    return (
      <div className="pb-24">
        {/* 모바일 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/recruitment/applications')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold truncate flex-1 mx-2">{t('application.detailTitle')}</h1>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canScheduleInterview && (
                <DropdownMenuItem onClick={() => setIsInterviewDialogOpen(true)}>
                  <Calendar className="mr-2 h-4 w-4" />
                  {t('interview.schedule')}
                </DropdownMenuItem>
              )}
              {canScreen && (
                <DropdownMenuItem onClick={() => setIsScreenDialogOpen(true)}>
                  <FileCheck className="mr-2 h-4 w-4" />
                  {t('application.screening.documentPass')}
                </DropdownMenuItem>
              )}
              {canMoveNext && availableNextStages.length > 0 && (
                <DropdownMenuItem onClick={() => setIsNextStageDialogOpen(true)}>
                  <ArrowRight className="mr-2 h-4 w-4" />
                  {t('application.nextStage.buttonLabel')}
                </DropdownMenuItem>
              )}
              {canHire && (
                <DropdownMenuItem onClick={() => setIsHireDialogOpen(true)}>
                  <UserCheck className="mr-2 h-4 w-4" />
                  {t('application.hire.title')}
                </DropdownMenuItem>
              )}
              {canReject && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setIsRejectDialogOpen(true)}
                    className="text-destructive"
                  >
                    <FileX className="mr-2 h-4 w-4" />
                    {t('application.rejection.reject')}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* 지원자 기본 정보 */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="text-lg font-semibold">{application.applicantName}</h2>
                <p className="text-sm text-muted-foreground">{application.applicationNumber}</p>
              </div>
              <ApplicationStatusBadge status={application.status} />
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{application.applicantEmail}</span>
              </div>
              {application.applicantPhone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{application.applicantPhone}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 진행 상태 */}
        <Card className="mb-4">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base">{t('application.progressStatus')}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <StageProgressBar currentStage={application.currentStage} />
            <div className="mt-3 text-sm text-muted-foreground">
              {t('application.currentLabel', { stage: STAGE_OPTIONS.find((s) => s.value === application.currentStage)?.label })}
            </div>
          </CardContent>
        </Card>

        {/* 지원 공고 */}
        <Card className="mb-4">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base">{t('application.appliedPosting')}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-sm">
              {application.jobCode && `[${application.jobCode}] `}
              {application.jobTitle}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t('application.applicationDateLabel', { date: format(new Date(application.createdAt), 'yyyy년 M월 d일', { locale: ko }) })}
            </p>
          </CardContent>
        </Card>

        {/* 이력서 */}
        {application.resumeFileId && (
          <Card className="mb-4">
            <CardContent className="p-4">
              <Button variant="outline" className="w-full">
                <Download className="mr-2 h-4 w-4" />
                {application.resumeFileName || t('application.resumeDownload')}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 자기소개서 */}
        {application.coverLetter && (
          <Card className="mb-4">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-base">{t('application.coverLetter')}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-sm whitespace-pre-wrap">{application.coverLetter}</div>
            </CardContent>
          </Card>
        )}

        {/* 서류 심사 의견 */}
        {application.screeningNotes && (
          <Card className="mb-4 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-base text-blue-800 dark:text-blue-200">{t('application.screening.screeningNotes')}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-sm text-blue-800 dark:text-blue-200">{application.screeningNotes}</p>
              {application.screenedByName && (
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                  - {application.screenedByName},{' '}
                  {application.screenedAt && format(new Date(application.screenedAt), 'M/d HH:mm')}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* 불합격 사유 */}
        {application.rejectionReason && (
          <Card className="mb-4 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-base text-red-800 dark:text-red-200">{t('application.rejection.rejectionReason')}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-sm text-red-800 dark:text-red-200">{application.rejectionReason}</p>
            </CardContent>
          </Card>
        )}

        {/* 면접 이력 */}
        <Card className="mb-4">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base">{t('interview.interviewCount', { count: interviews.length })}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {interviews.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t('interview.noRegisteredInterviews')}
              </p>
            ) : (
              <div className="space-y-3">
                {interviews.map((interview) => (
                  <InterviewCard key={interview.id} interview={interview} t={t} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {renderDialogs()}
      </div>
    );
  }

  // 데스크톱 레이아웃
  return (
    <>
      <PageHeader
        title={t('application.detailTitle')}
        description={t('application.applicationNumberLabel', { number: application.applicationNumber })}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate('/recruitment/applications')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('common.backToList')}
            </Button>
            {canScheduleInterview && (
              <Button variant="outline" onClick={() => setIsInterviewDialogOpen(true)}>
                <Calendar className="mr-2 h-4 w-4" />
                {t('interview.schedule')}
              </Button>
            )}
            {canReject && (
              <Button
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={() => setIsRejectDialogOpen(true)}
              >
                <FileX className="mr-2 h-4 w-4" />
                {t('application.rejection.reject')}
              </Button>
            )}
            {canScreen && (
              <Button onClick={() => setIsScreenDialogOpen(true)}>
                <FileCheck className="mr-2 h-4 w-4" />
                {t('application.screening.documentPass')}
              </Button>
            )}
            {canMoveNext && availableNextStages.length > 0 && (
              <Button onClick={() => setIsNextStageDialogOpen(true)}>
                <ArrowRight className="mr-2 h-4 w-4" />
                {t('application.nextStage.buttonLabel')}
              </Button>
            )}
            {canHire && (
              <Button className="bg-green-600 hover:bg-green-700" onClick={() => setIsHireDialogOpen(true)}>
                <UserCheck className="mr-2 h-4 w-4" />
                {t('application.hire.title')}
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
              <TabsTrigger value="info">{t('application.applicantInfo')}</TabsTrigger>
              <TabsTrigger value="interviews">{t('interview.interviewCount', { count: interviews.length })}</TabsTrigger>
            </TabsList>

            <TabsContent value="info">
              <Card>
                <CardHeader>
                  <CardTitle>{t('application.applicantInfo')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2 pb-4 border-b">
                    <div>
                      <Label className="text-muted-foreground">{t('application.applicantName')}</Label>
                      <p className="text-sm mt-1 font-medium">{application.applicantName}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">{t('application.applicantEmail')}</Label>
                      <p className="text-sm mt-1 flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {application.applicantEmail}
                      </p>
                    </div>
                    {application.applicantPhone && (
                      <div>
                        <Label className="text-muted-foreground">{t('application.applicantPhone')}</Label>
                        <p className="text-sm mt-1 flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          {application.applicantPhone}
                        </p>
                      </div>
                    )}
                    <div>
                      <Label className="text-muted-foreground">{t('application.applicationDate')}</Label>
                      <p className="text-sm mt-1">
                        {format(new Date(application.createdAt), 'yyyy년 M월 d일 HH:mm', {
                          locale: ko,
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="pb-4 border-b">
                    <Label className="text-muted-foreground">{t('application.appliedPosting')}</Label>
                    <p className="text-sm mt-1">
                      {application.jobCode && `[${application.jobCode}] `}
                      {application.jobTitle}
                    </p>
                  </div>

                  {application.resumeFileId && (
                    <div>
                      <Label className="text-muted-foreground">{t('application.resume')}</Label>
                      <div className="mt-2">
                        <Button variant="outline" size="sm">
                          <Download className="mr-2 h-4 w-4" />
                          {application.resumeFileName || t('application.resumeDownload')}
                        </Button>
                      </div>
                    </div>
                  )}

                  {application.coverLetter && (
                    <div>
                      <Label className="text-muted-foreground">{t('application.coverLetter')}</Label>
                      <div className="mt-2 p-4 rounded-lg bg-muted/50 whitespace-pre-wrap text-sm">
                        {application.coverLetter}
                      </div>
                    </div>
                  )}

                  {application.screeningNotes && (
                    <div>
                      <Label className="text-muted-foreground">{t('application.screening.screeningNotes')}</Label>
                      <div className="mt-2 p-4 rounded-lg bg-blue-50 text-sm">
                        <p className="text-blue-800">{application.screeningNotes}</p>
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
                      <Label className="text-muted-foreground">{t('application.rejection.rejectionReason')}</Label>
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
                  <CardTitle>{t('interview.history')}</CardTitle>
                </CardHeader>
                <CardContent>
                  {interviews.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {t('interview.noRegisteredInterviews')}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {interviews.map((interview) => (
                        <InterviewCard key={interview.id} interview={interview} t={t} />
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
              <CardTitle>{t('application.currentStatus')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-muted-foreground">{t('application.progressStatus')}</Label>
                <div className="mt-2">
                  <ApplicationStatusBadge status={application.status} />
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">{t('application.currentStage')}</Label>
                <p className="text-sm mt-1">
                  {STAGE_OPTIONS.find((s) => s.value === application.currentStage)?.label}
                </p>
              </div>
              {application.statusChangedAt && (
                <div>
                  <Label className="text-muted-foreground">{t('application.statusChangedDate')}</Label>
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

      {renderDialogs()}
    </>
  );
}

function InterviewCard({ interview, t }: { interview: any; t: (key: string, options?: any) => string }) {
  const { data: scoresData } = useInterviewScores(interview.id);
  const scores = scoresData?.data ?? [];

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <InterviewTypeBadge type={interview.interviewType} />
          <InterviewStatusBadge status={interview.status} />
        </div>
        {interview.overallScore && (
          <span className="text-sm font-medium">{t('interview.averageScore', { score: interview.overallScore.toFixed(1) })}</span>
        )}
      </div>
      <div className="grid gap-2 text-sm">
        <div>
          <span className="text-muted-foreground">{t('interview.detail.dateTimeLabel')}</span>
          {format(new Date(interview.scheduledDate), 'yyyy년 M월 d일', { locale: ko })}
          {interview.scheduledTime && ` ${interview.scheduledTime}`}
          <span className="text-muted-foreground"> ({t('common.minutesUnit', { minutes: interview.durationMinutes })})</span>
        </div>
        {interview.location && (
          <div>
            <span className="text-muted-foreground">{t('interview.detail.locationLabel')}</span>
            {interview.location}
          </div>
        )}
        {interview.interviewerNames && interview.interviewerNames.length > 0 && (
          <div>
            <span className="text-muted-foreground">{t('interview.detail.interviewerLabel')}</span>
            {interview.interviewerNames.join(', ')}
          </div>
        )}
      </div>
      {scores.length > 0 && (
        <div className="pt-2 border-t">
          <p className="text-sm font-medium mb-2">{t('interviewScore.evaluationResult')}</p>
          <div className="space-y-2">
            {scores.map((score: any) => (
              <div key={score.id} className="flex items-center justify-between text-sm">
                <span>{score.interviewerName}</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{t('common.scoreUnit', { score: score.overallScore })}</span>
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
