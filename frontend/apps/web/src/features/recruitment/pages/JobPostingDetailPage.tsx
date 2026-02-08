import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
      toast({ title: '채용공고가 게시되었습니다.' });
      setIsPublishDialogOpen(false);
    } catch {
      toast({ title: '게시에 실패했습니다.', variant: 'destructive' });
    }
  };

  const handleClose = async () => {
    if (!id) return;
    try {
      await closeMutation.mutateAsync(id);
      toast({ title: '채용공고가 마감되었습니다.' });
      setIsCloseDialogOpen(false);
    } catch {
      toast({ title: '마감에 실패했습니다.', variant: 'destructive' });
    }
  };

  const handleComplete = async () => {
    if (!id) return;
    try {
      await completeMutation.mutateAsync(id);
      toast({ title: '채용이 완료되었습니다.' });
      setIsCompleteDialogOpen(false);
    } catch {
      toast({ title: '완료 처리에 실패했습니다.', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast({ title: '채용공고가 삭제되었습니다.' });
      navigate('/recruitment');
    } catch {
      toast({ title: '삭제에 실패했습니다.', variant: 'destructive' });
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
        <p className="text-muted-foreground">채용공고를 찾을 수 없습니다.</p>
        <Button variant="outline" onClick={() => navigate('/recruitment')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          목록으로
        </Button>
      </div>
    );
  }

  const canPublish = job.status === 'DRAFT';
  const canClose = job.status === 'OPEN';
  const canComplete = job.status === 'CLOSED';
  const canEdit = job.status === 'DRAFT';
  const canDelete = job.status === 'DRAFT';

  const renderDialogs = () => (
    <>
      <ConfirmDialog
        open={isPublishDialogOpen}
        onOpenChange={setIsPublishDialogOpen}
        title="채용공고 게시"
        description="이 채용공고를 게시하시겠습니까? 게시 후에는 지원자를 받을 수 있습니다."
        confirmText="게시"
        onConfirm={handlePublish}
        isLoading={publishMutation.isPending}
      />
      <ConfirmDialog
        open={isCloseDialogOpen}
        onOpenChange={setIsCloseDialogOpen}
        title="채용공고 마감"
        description="이 채용공고를 마감하시겠습니까? 마감 후에는 더 이상 지원을 받을 수 없습니다."
        confirmText="마감"
        onConfirm={handleClose}
        isLoading={closeMutation.isPending}
      />
      <ConfirmDialog
        open={isCompleteDialogOpen}
        onOpenChange={setIsCompleteDialogOpen}
        title="채용 완료"
        description="이 채용을 완료 처리하시겠습니까?"
        confirmText="완료"
        onConfirm={handleComplete}
        isLoading={completeMutation.isPending}
      />
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="채용공고 삭제"
        description="정말로 이 채용공고를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        confirmText="삭제"
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
          <h1 className="font-semibold truncate flex-1 mx-2">채용공고 상세</h1>
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
                  수정
                </DropdownMenuItem>
              )}
              {canDelete && (
                <DropdownMenuItem
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  삭제
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
                <span>모집 {job.headcount}명</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <span>조회 {job.viewCount}</span>
              </div>
              <div className="flex items-center gap-2 col-span-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{job.workLocation || '-'}</span>
              </div>
              <div className="flex items-center gap-2 col-span-2">
                <Banknote className="h-4 w-4 text-muted-foreground" />
                <span>
                  {job.salaryNegotiable
                    ? '협의 가능'
                    : job.salaryMin && job.salaryMax
                    ? `${job.salaryMin.toLocaleString()} ~ ${job.salaryMax.toLocaleString()} 만원`
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
            <CardTitle className="text-base">지원 현황</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <StageCountBar stageCounts={stageCounts} />
            <Button
              variant="outline"
              className="w-full mt-3"
              onClick={() => navigate(`/recruitment/applications?jobPostingId=${id}`)}
            >
              전체 지원자 보기 ({job.applicationCount}명)
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* 직무 설명 */}
        <Card className="mb-4">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base">직무 설명</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-sm whitespace-pre-wrap">{job.jobDescription}</div>
          </CardContent>
        </Card>

        {/* 자격 요건 */}
        {job.requirements && (
          <Card className="mb-4">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-base">자격 요건</CardTitle>
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
              <CardTitle className="text-base">우대 사항</CardTitle>
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
              <CardTitle className="text-base">최근 지원자</CardTitle>
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
            <CardTitle className="text-base">담당자 정보</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-muted-foreground">채용 담당자</p>
                <p className="font-medium">{job.recruiterName || '-'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">등록일</p>
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
                공고 게시
              </Button>
            )}
            {canClose && (
              <Button
                variant="outline"
                className="w-full text-orange-600"
                onClick={() => setIsCloseDialogOpen(true)}
              >
                <XCircle className="mr-2 h-4 w-4" />
                공고 마감
              </Button>
            )}
            {canComplete && (
              <Button className="w-full" onClick={() => setIsCompleteDialogOpen(true)}>
                <CheckCircle className="mr-2 h-4 w-4" />
                채용 완료
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
        title="채용공고 상세"
        description={`공고번호: ${job.jobCode}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate('/recruitment')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              목록으로
            </Button>
            {canEdit && (
              <Button variant="outline" onClick={() => navigate(`/recruitment/jobs/${id}/edit`)}>
                <Edit className="mr-2 h-4 w-4" />
                수정
              </Button>
            )}
            {canDelete && (
              <Button
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                삭제
              </Button>
            )}
            {canPublish && (
              <Button onClick={() => setIsPublishDialogOpen(true)}>
                <Send className="mr-2 h-4 w-4" />
                게시
              </Button>
            )}
            {canClose && (
              <Button
                variant="outline"
                className="text-orange-600 hover:text-orange-700"
                onClick={() => setIsCloseDialogOpen(true)}
              >
                <XCircle className="mr-2 h-4 w-4" />
                마감
              </Button>
            )}
            {canComplete && (
              <Button onClick={() => setIsCompleteDialogOpen(true)}>
                <CheckCircle className="mr-2 h-4 w-4" />
                완료
              </Button>
            )}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="detail">공고 내용</TabsTrigger>
              <TabsTrigger value="applications">지원자 ({job.applicationCount})</TabsTrigger>
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
                      <Label className="text-muted-foreground">채용 부서</Label>
                      <p className="text-sm mt-1">{job.departmentName || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">직책</Label>
                      <p className="text-sm mt-1">{job.positionName || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">모집 인원</Label>
                      <p className="text-sm mt-1 flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {job.headcount}명
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">지원자 수</Label>
                      <p className="text-sm mt-1">{job.applicationCount}명</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">근무지</Label>
                      <p className="text-sm mt-1 flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {job.workLocation || '-'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">급여</Label>
                      <p className="text-sm mt-1 flex items-center gap-1">
                        <Banknote className="h-4 w-4" />
                        {job.salaryNegotiable
                          ? '협의 가능'
                          : job.salaryMin && job.salaryMax
                          ? `${job.salaryMin.toLocaleString()} ~ ${job.salaryMax.toLocaleString()} 만원`
                          : '-'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">공고 기간</Label>
                      <p className="text-sm mt-1">
                        {format(new Date(job.openDate), 'yyyy년 M월 d일', { locale: ko })}
                        {' ~ '}
                        {format(new Date(job.closeDate), 'yyyy년 M월 d일', { locale: ko })}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">조회수</Label>
                      <p className="text-sm mt-1 flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {job.viewCount}
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-muted-foreground">직무 설명</Label>
                    <div className="mt-2 p-4 rounded-lg bg-muted/50 whitespace-pre-wrap text-sm">
                      {job.jobDescription}
                    </div>
                  </div>

                  {job.requirements && (
                    <div>
                      <Label className="text-muted-foreground">자격 요건</Label>
                      <div className="mt-2 p-4 rounded-lg bg-muted/50 whitespace-pre-wrap text-sm">
                        {job.requirements}
                      </div>
                    </div>
                  )}

                  {job.preferredQualifications && (
                    <div>
                      <Label className="text-muted-foreground">우대 사항</Label>
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
                  <CardTitle>최근 지원자</CardTitle>
                </CardHeader>
                <CardContent>
                  {applications.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      아직 지원자가 없습니다.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="px-4 py-2 text-left text-sm font-medium">지원번호</th>
                            <th className="px-4 py-2 text-left text-sm font-medium">이름</th>
                            <th className="px-4 py-2 text-left text-sm font-medium">단계</th>
                            <th className="px-4 py-2 text-left text-sm font-medium">상태</th>
                            <th className="px-4 py-2 text-left text-sm font-medium">지원일</th>
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
                      전체 지원자 보기
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
              <CardTitle>지원 현황</CardTitle>
            </CardHeader>
            <CardContent>
              <StageCountBar stageCounts={stageCounts} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>담당자 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <Label className="text-muted-foreground">채용 담당자</Label>
                <p className="text-sm mt-1">{job.recruiterName || '-'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">등록일</Label>
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
