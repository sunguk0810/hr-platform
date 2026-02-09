import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { PageHeader } from '@/components/common/PageHeader';
import {
  JobStatusBadge,
  RecruitmentEmploymentTypeBadge,
  ApplicationStatusBadge,
} from '@/components/common/StatusBadge';
import { StageCountBar } from '../components/StageProgressBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useIsMobile } from '@/hooks/useMediaQuery';
import {
  ArrowLeft,
  Edit,
  Loader2,
  Send,
  XCircle,
  CheckCircle,
  Trash2,
  Users,
  Eye,
  MapPin,
  Banknote,
  ChevronRight,
  Calendar,
  MoreVertical,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  useJobPosting,
  useApplicationsByJob,
  useApplicationStageCounts,
  usePublishJobPosting,
  useCloseJobPosting,
  useCompleteJobPosting,
  useDeleteJobPosting,
} from '../hooks/useRecruitment';
import { useToast } from '@/hooks/useToast';

export default function JobPostingDetailPage() {
  const { t } = useTranslation('recruitment');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false);
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('detail');

  const { data, isLoading, isError } = useJobPosting(id || '');
  const { data: applicationsData } = useApplicationsByJob(id || '', { size: 5 });
  const { data: stageCountsData } = useApplicationStageCounts(id || '');

  const publishMutation = usePublishJobPosting();
  const closeMutation = useCloseJobPosting();
  const completeMutation = useCompleteJobPosting();
  const deleteMutation = useDeleteJobPosting();

  const job = data?.data;
  const applications = applicationsData?.data?.content ?? [];
  const stageCounts = stageCountsData?.data ?? [];

  const handlePublish = async () => {
    if (!id) return;
    try {
      await publishMutation.mutateAsync(id);
      toast({ title: t('jobPosting.toast.published') });
      setIsPublishDialogOpen(false);
    } catch {
      toast({ title: t('jobPosting.toast.publishFailed'), variant: 'destructive' });
    }
  };

  const handleClose = async () => {
    if (!id) return;
    try {
      await closeMutation.mutateAsync(id);
      toast({ title: t('jobPosting.toast.closed') });
      setIsCloseDialogOpen(false);
    } catch {
      toast({ title: t('jobPosting.toast.closeFailed'), variant: 'destructive' });
    }
  };

  const handleComplete = async () => {
    if (!id) return;
    try {
      await completeMutation.mutateAsync(id);
      toast({ title: t('jobPosting.toast.completed') });
      setIsCompleteDialogOpen(false);
    } catch {
      toast({ title: t('jobPosting.toast.completeFailed'), variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast({ title: t('jobPosting.toast.deleted') });
      navigate('/recruitment');
    } catch {
      toast({ title: t('jobPosting.toast.deleteFailed'), variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !job) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">{t('jobPosting.notFoundMessage')}</p>
        <Button variant="outline" onClick={() => navigate('/recruitment')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('common.backToList')}
        </Button>
      </div>
    );
  }

  const canPublish = job.status === 'DRAFT' || job.status === 'PENDING';
  const canClose = job.status === 'PUBLISHED';
  const canComplete = job.status === 'CLOSED';
  const canEdit = job.status === 'DRAFT';
  const canDelete = job.status === 'DRAFT';

  const renderDialogs = () => (
    <>
      <ConfirmDialog
        open={isPublishDialogOpen}
        onOpenChange={setIsPublishDialogOpen}
        title={t('jobPosting.dialogs.publishTitle')}
        description={t('jobPosting.dialogs.publishDescription')}
        confirmText={t('jobPosting.dialogs.publishConfirm')}
        onConfirm={handlePublish}
        isLoading={publishMutation.isPending}
      />
      <ConfirmDialog
        open={isCloseDialogOpen}
        onOpenChange={setIsCloseDialogOpen}
        title={t('jobPosting.dialogs.closeTitle')}
        description={t('jobPosting.dialogs.closeDescription')}
        confirmText={t('jobPosting.dialogs.closeConfirm')}
        onConfirm={handleClose}
        isLoading={closeMutation.isPending}
      />
      <ConfirmDialog
        open={isCompleteDialogOpen}
        onOpenChange={setIsCompleteDialogOpen}
        title={t('jobPosting.dialogs.completeTitle')}
        description={t('jobPosting.dialogs.completeDescription')}
        confirmText={t('jobPosting.dialogs.completeConfirm')}
        onConfirm={handleComplete}
        isLoading={completeMutation.isPending}
      />
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title={t('jobPosting.dialogs.deleteTitle')}
        description={t('jobPosting.dialogs.deleteDescription')}
        confirmText={t('jobPosting.dialogs.deleteConfirm')}
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
      />
    </>
  );

  // 모바일 레이아웃
  if (isMobile) {
    return (
      <div className="pb-24">
        {/* 모바일 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/recruitment')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold truncate flex-1 mx-2">{t('jobPosting.detailTitle')}</h1>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canEdit && (
                <DropdownMenuItem onClick={() => navigate(`/recruitment/jobs/${id}/edit`)}>
                  <Edit className="mr-2 h-4 w-4" />
                  {t('common.edit')}
                </DropdownMenuItem>
              )}
              {canDelete && (
                <DropdownMenuItem
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t('common.delete')}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* 공고 정보 카드 */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <RecruitmentEmploymentTypeBadge type={job.employmentType} />
              <JobStatusBadge status={job.status} />
            </div>
            <h2 className="text-lg font-semibold mb-2">{job.title}</h2>
            <p className="text-sm text-muted-foreground mb-3">{job.jobCode}</p>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{t('common.headcountWithUnit', { count: job.headcount })}</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <span>{t('common.viewCount', { count: job.viewCount })}</span>
              </div>
              <div className="flex items-center gap-2 col-span-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{job.workLocation || '-'}</span>
              </div>
              <div className="flex items-center gap-2 col-span-2">
                <Banknote className="h-4 w-4 text-muted-foreground" />
                <span>
                  {job.salaryNegotiable
                    ? t('jobPosting.detail.salaryNegotiable')
                    : job.salaryMin && job.salaryMax
                    ? t('jobPosting.detail.salaryRange', { min: job.salaryMin.toLocaleString(), max: job.salaryMax.toLocaleString() })
                    : '-'}
                </span>
              </div>
              <div className="flex items-center gap-2 col-span-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  {format(new Date(job.openDate), 'M/d', { locale: ko })} ~{' '}
                  {format(new Date(job.closeDate), 'M/d', { locale: ko })}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 지원 현황 */}
        <Card className="mb-4">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base">{t('jobPosting.detail.applicationStatus')}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <StageCountBar stageCounts={stageCounts} />
            <Button
              variant="outline"
              className="w-full mt-3"
              onClick={() => navigate(`/recruitment/applications?jobPostingId=${id}`)}
            >
              {t('jobPosting.detail.viewAllApplicantsWithCount', { count: job.applicationCount })}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* 직무 설명 */}
        <Card className="mb-4">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base">{t('jobPosting.detail.jobDescription')}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-sm whitespace-pre-wrap">{job.jobDescription}</div>
          </CardContent>
        </Card>

        {/* 자격 요건 */}
        {job.requirements && (
          <Card className="mb-4">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-base">{t('jobPosting.detail.requirements')}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-sm whitespace-pre-wrap">{job.requirements}</div>
            </CardContent>
          </Card>
        )}

        {/* 우대 사항 */}
        {job.preferredQualifications && (
          <Card className="mb-4">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-base">{t('jobPosting.detail.preferredQualifications')}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-sm whitespace-pre-wrap">{job.preferredQualifications}</div>
            </CardContent>
          </Card>
        )}

        {/* 최근 지원자 */}
        {applications.length > 0 && (
          <Card className="mb-4">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-base">{t('jobPosting.detail.recentApplicants')}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3">
              {applications.map((app) => (
                <div
                  key={app.id}
                  onClick={() => navigate(`/recruitment/applications/${app.id}`)}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted"
                >
                  <div>
                    <p className="font-medium text-sm">{app.applicantName}</p>
                    <p className="text-xs text-muted-foreground">{app.currentStage}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <ApplicationStatusBadge status={app.status} />
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* 담당자 정보 */}
        <Card className="mb-4">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base">{t('jobPosting.detail.managerInfo')}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-muted-foreground">{t('jobPosting.detail.recruiter')}</p>
                <p className="font-medium">{job.recruiterName || '-'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t('jobPosting.detail.createdDate')}</p>
                <p className="font-medium">
                  {format(new Date(job.createdAt), 'M/d', { locale: ko })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 하단 액션 버튼 */}
        {(canPublish || canClose || canComplete) && (
          <div className="fixed bottom-16 left-0 right-0 p-4 bg-background border-t">
            {canPublish && (
              <Button className="w-full" onClick={() => setIsPublishDialogOpen(true)}>
                <Send className="mr-2 h-4 w-4" />
                {t('jobPosting.actions.publishFull')}
              </Button>
            )}
            {canClose && (
              <Button
                variant="outline"
                className="w-full text-orange-600"
                onClick={() => setIsCloseDialogOpen(true)}
              >
                <XCircle className="mr-2 h-4 w-4" />
                {t('jobPosting.actions.closeFull')}
              </Button>
            )}
            {canComplete && (
              <Button className="w-full" onClick={() => setIsCompleteDialogOpen(true)}>
                <CheckCircle className="mr-2 h-4 w-4" />
                {t('jobPosting.actions.completeFull')}
              </Button>
            )}
          </div>
        )}

        {renderDialogs()}
      </div>
    );
  }

  // 데스크톱 레이아웃
  return (
    <>
      <PageHeader
        title={t('jobPosting.detailTitle')}
        description={t('jobPosting.postingNumberLabel', { code: job.jobCode })}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate('/recruitment')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('common.backToList')}
            </Button>
            {canEdit && (
              <Button variant="outline" onClick={() => navigate(`/recruitment/jobs/${id}/edit`)}>
                <Edit className="mr-2 h-4 w-4" />
                {t('common.edit')}
              </Button>
            )}
            {canDelete && (
              <Button
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t('common.delete')}
              </Button>
            )}
            {canPublish && (
              <Button onClick={() => setIsPublishDialogOpen(true)}>
                <Send className="mr-2 h-4 w-4" />
                {t('jobPosting.actions.publish')}
              </Button>
            )}
            {canClose && (
              <Button
                variant="outline"
                className="text-orange-600 hover:text-orange-700"
                onClick={() => setIsCloseDialogOpen(true)}
              >
                <XCircle className="mr-2 h-4 w-4" />
                {t('jobPosting.actions.close')}
              </Button>
            )}
            {canComplete && (
              <Button onClick={() => setIsCompleteDialogOpen(true)}>
                <CheckCircle className="mr-2 h-4 w-4" />
                {t('jobPosting.actions.complete')}
              </Button>
            )}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="detail">{t('jobPosting.detail.postingContent')}</TabsTrigger>
              <TabsTrigger value="applications">{t('jobPosting.detail.applicantsTab', { count: job.applicationCount })}</TabsTrigger>
            </TabsList>

            <TabsContent value="detail">
              <Card>
                <CardHeader className="flex flex-row items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">{job.title}</CardTitle>
                    <div className="flex flex-wrap items-center gap-2">
                      <RecruitmentEmploymentTypeBadge type={job.employmentType} />
                      <JobStatusBadge status={job.status} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2 pb-4 border-b">
                    <div>
                      <Label className="text-muted-foreground">{t('jobPosting.detail.hiringDepartment')}</Label>
                      <p className="text-sm mt-1">{job.departmentName || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">{t('jobPosting.detail.position')}</Label>
                      <p className="text-sm mt-1">{job.positionName || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">{t('jobPosting.detail.headcount')}</Label>
                      <p className="text-sm mt-1 flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {t('common.countWithUnit', { count: job.headcount })}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">{t('jobPosting.detail.applicantCount')}</Label>
                      <p className="text-sm mt-1">{t('common.countWithUnit', { count: job.applicationCount })}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">{t('jobPosting.detail.workLocation')}</Label>
                      <p className="text-sm mt-1 flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {job.workLocation || '-'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">{t('jobPosting.detail.salary')}</Label>
                      <p className="text-sm mt-1 flex items-center gap-1">
                        <Banknote className="h-4 w-4" />
                        {job.salaryNegotiable
                          ? t('jobPosting.detail.salaryNegotiable')
                          : job.salaryMin && job.salaryMax
                          ? t('jobPosting.detail.salaryRange', { min: job.salaryMin.toLocaleString(), max: job.salaryMax.toLocaleString() })
                          : '-'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">{t('jobPosting.detail.postingPeriod')}</Label>
                      <p className="text-sm mt-1">
                        {format(new Date(job.openDate), 'yyyy년 M월 d일', { locale: ko })}
                        {' ~ '}
                        {format(new Date(job.closeDate), 'yyyy년 M월 d일', { locale: ko })}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">{t('jobPosting.detail.viewCountLabel')}</Label>
                      <p className="text-sm mt-1 flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {job.viewCount}
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-muted-foreground">{t('jobPosting.detail.jobDescription')}</Label>
                    <div className="mt-2 p-4 rounded-lg bg-muted/50 whitespace-pre-wrap text-sm">
                      {job.jobDescription}
                    </div>
                  </div>

                  {job.requirements && (
                    <div>
                      <Label className="text-muted-foreground">{t('jobPosting.detail.requirements')}</Label>
                      <div className="mt-2 p-4 rounded-lg bg-muted/50 whitespace-pre-wrap text-sm">
                        {job.requirements}
                      </div>
                    </div>
                  )}

                  {job.preferredQualifications && (
                    <div>
                      <Label className="text-muted-foreground">{t('jobPosting.detail.preferredQualifications')}</Label>
                      <div className="mt-2 p-4 rounded-lg bg-muted/50 whitespace-pre-wrap text-sm">
                        {job.preferredQualifications}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="applications">
              <Card>
                <CardHeader>
                  <CardTitle>{t('jobPosting.detail.recentApplicants')}</CardTitle>
                </CardHeader>
                <CardContent>
                  {applications.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {t('jobPosting.detail.noApplicantsYet')}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="px-4 py-2 text-left text-sm font-medium">{t('application.table.applicationNumber')}</th>
                            <th className="px-4 py-2 text-left text-sm font-medium">{t('application.applicantName')}</th>
                            <th className="px-4 py-2 text-left text-sm font-medium">{t('application.table.stage')}</th>
                            <th className="px-4 py-2 text-left text-sm font-medium">{t('application.table.status')}</th>
                            <th className="px-4 py-2 text-left text-sm font-medium">{t('application.table.applicationDate')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {applications.map((app) => (
                            <tr
                              key={app.id}
                              onClick={() => navigate(`/recruitment/applications/${app.id}`)}
                              className="border-b cursor-pointer hover:bg-muted/50"
                            >
                              <td className="px-4 py-2 font-mono text-sm">{app.applicationNumber}</td>
                              <td className="px-4 py-2 text-sm font-medium">{app.applicantName}</td>
                              <td className="px-4 py-2 text-sm text-muted-foreground">
                                {app.currentStage}
                              </td>
                              <td className="px-4 py-2">
                                <ApplicationStatusBadge status={app.status} />
                              </td>
                              <td className="px-4 py-2 text-sm text-muted-foreground">
                                {app.createdAt ? format(new Date(app.createdAt), 'M/d', { locale: ko }) : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() =>
                        navigate(`/recruitment/applications?jobPostingId=${id}`)
                      }
                    >
                      {t('jobPosting.detail.viewAllApplicants')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('jobPosting.detail.applicationStatus')}</CardTitle>
            </CardHeader>
            <CardContent>
              <StageCountBar stageCounts={stageCounts} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('jobPosting.detail.managerInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <Label className="text-muted-foreground">{t('jobPosting.detail.recruiter')}</Label>
                <p className="text-sm mt-1">{job.recruiterName || '-'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">{t('jobPosting.detail.createdDate')}</Label>
                <p className="text-sm mt-1">
                  {format(new Date(job.createdAt), 'yyyy년 M월 d일 HH:mm', { locale: ko })}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {renderDialogs()}
    </>
  );
}
