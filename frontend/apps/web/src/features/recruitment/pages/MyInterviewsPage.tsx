import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { format, isToday } from 'date-fns';
import { ko } from 'date-fns/locale';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { SkeletonTable } from '@/components/common/Skeleton';
import { Pagination } from '@/components/common/Pagination';
import { PullToRefreshContainer } from '@/components/mobile';
import {
  InterviewStatusBadge,
  InterviewTypeBadge,
} from '@/components/common/StatusBadge';
import { InterviewScoreForm } from '../components/InterviewScoreForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useIsMobile } from '@/hooks/useMediaQuery';
import {
  CalendarCheck,
  Clock,
  CheckCircle,
  Edit,
  MapPin,
  Video,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import {
  useMyInterviews,
  useTodayInterviews,
  useSubmitInterviewScore,
  useInterviewSearchParams,
} from '../hooks/useRecruitment';
import { useToast } from '@/hooks/useToast';
import type { SubmitInterviewScoreRequest, InterviewListItem } from '@hr-platform/shared-types';

export default function MyInterviewsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const [activeTab, setActiveTab] = useState<'today' | 'upcoming' | 'pending_eval' | 'completed'>('today');
  const [selectedInterview, setSelectedInterview] = useState<InterviewListItem | null>(null);
  const [isScoreDialogOpen, setIsScoreDialogOpen] = useState(false);

  const { params, searchState, setPage } = useInterviewSearchParams();

  const { data: todayData, isLoading: isTodayLoading } = useTodayInterviews();
  const { data, isLoading, isError } = useMyInterviews({
    ...params,
    status: activeTab === 'completed' ? 'COMPLETED' : activeTab === 'upcoming' ? 'SCHEDULED' : undefined,
  });

  const submitScoreMutation = useSubmitInterviewScore();

  const todayInterviews = todayData?.data ?? [];
  const interviews = data?.data?.content ?? [];
  const totalPages = data?.data?.page?.totalPages ?? 0;

  const pendingEvalInterviews = interviews.filter(
    (i) => i.status === 'COMPLETED' && !i.overallScore
  );

  const handleOpenScoreDialog = (interview: InterviewListItem) => {
    setSelectedInterview(interview);
    setIsScoreDialogOpen(true);
  };

  const handleSubmitScore = async (data: SubmitInterviewScoreRequest) => {
    if (!selectedInterview) return;
    try {
      await submitScoreMutation.mutateAsync({
        interviewId: selectedInterview.id,
        data,
      });
      toast({ title: '평가가 제출되었습니다.' });
      setIsScoreDialogOpen(false);
      setSelectedInterview(null);
    } catch {
      toast({ title: '평가 제출에 실패했습니다.', variant: 'destructive' });
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value as typeof activeTab);
    setPage(0);
  };

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['my-interviews'] });
    await queryClient.invalidateQueries({ queryKey: ['today-interviews'] });
  };

  // Shared score dialog render function
  const renderScoreDialog = () => (
    <Dialog open={isScoreDialogOpen} onOpenChange={setIsScoreDialogOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>면접 평가 입력</DialogTitle>
        </DialogHeader>
        {selectedInterview && (
          <InterviewScoreForm
            interviewId={selectedInterview.id}
            applicantName={selectedInterview.applicantName}
            interviewType={
              selectedInterview.interviewType === 'PHONE' ? '전화면접' :
              selectedInterview.interviewType === 'VIDEO' ? '화상면접' :
              selectedInterview.interviewType === 'ONSITE' ? '대면면접' :
              selectedInterview.interviewType === 'TECHNICAL' ? '기술면접' :
              selectedInterview.interviewType === 'FINAL' ? '최종면접' : ''
            }
            onSubmit={handleSubmitScore}
            onCancel={() => {
              setIsScoreDialogOpen(false);
              setSelectedInterview(null);
            }}
            isSubmitting={submitScoreMutation.isPending}
          />
        )}
      </DialogContent>
    </Dialog>
  );

  // Mobile interview card render
  const renderMobileInterviewCard = (interview: InterviewListItem, showEvalButton = false) => (
    <div key={interview.id} className="bg-card rounded-xl border p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <InterviewTypeBadge type={interview.interviewType} />
            <InterviewStatusBadge status={interview.status} />
            {isToday(new Date(interview.scheduledDate)) && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                오늘
              </span>
            )}
          </div>
          <p className="font-medium">{interview.applicantName}</p>
          <p className="text-sm text-muted-foreground line-clamp-1">{interview.jobTitle}</p>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </div>

      <div className="space-y-2 text-sm mt-3 pt-3 border-t">
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <span>{format(new Date(interview.scheduledDate), 'M월 d일 (E)', { locale: ko })}{interview.scheduledTime && ` ${interview.scheduledTime}`}</span>
          <span className="text-muted-foreground">({interview.durationMinutes}분)</span>
        </div>
        {interview.location && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            <span>{interview.location}</span>
          </div>
        )}
        {interview.meetingUrl && (
          <a
            href={interview.meetingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-blue-600"
            onClick={(e) => e.stopPropagation()}
          >
            <Video className="h-3.5 w-3.5" />
            화상회의 참여
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t">
        {interview.overallScore !== undefined && interview.overallScore !== null ? (
          <div className="text-sm">
            <span className="text-muted-foreground">내 평가: </span>
            <span className="font-medium">{interview.overallScore.toFixed(1)}점</span>
          </div>
        ) : showEvalButton && interview.status === 'COMPLETED' ? (
          <Button size="sm" onClick={(e) => { e.stopPropagation(); handleOpenScoreDialog(interview); }}>
            <Edit className="mr-1 h-4 w-4" />
            평가
          </Button>
        ) : (
          <div />
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => { e.stopPropagation(); navigate(`/recruitment/applications/${interview.applicationId}`); }}
        >
          상세
        </Button>
      </div>
    </div>
  );

  const renderInterviewList = (list: InterviewListItem[], showEvalButton = false) => {
    if (list.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          면접 일정이 없습니다.
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {list.map((interview) => (
          <div
            key={interview.id}
            className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <InterviewTypeBadge type={interview.interviewType} />
                  <InterviewStatusBadge status={interview.status} />
                  {isToday(new Date(interview.scheduledDate)) && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                      오늘
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-medium">{interview.applicantName}</p>
                  <p className="text-sm text-muted-foreground">{interview.jobTitle}</p>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {format(new Date(interview.scheduledDate), 'M월 d일 (E)', { locale: ko })}{interview.scheduledTime && ` ${interview.scheduledTime}`}
                    <span>({interview.durationMinutes}분)</span>
                  </div>
                  {interview.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {interview.location}
                    </div>
                  )}
                  {interview.meetingUrl && (
                    <a
                      href={interview.meetingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-600 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Video className="h-4 w-4" />
                      화상회의 참여
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {interview.overallScore !== undefined && interview.overallScore !== null ? (
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">내 평가</p>
                    <p className="font-medium">{interview.overallScore.toFixed(1)}점</p>
                  </div>
                ) : showEvalButton && interview.status === 'COMPLETED' ? (
                  <Button size="sm" onClick={() => handleOpenScoreDialog(interview)}>
                    <Edit className="mr-2 h-4 w-4" />
                    평가 입력
                  </Button>
                ) : null}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/recruitment/applications/${interview.applicationId}`)}
                >
                  상세
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Mobile Layout
  if (isMobile) {
    return (
      <PullToRefreshContainer onRefresh={handleRefresh}>
        <div className="space-y-4 pb-20">
          {/* Mobile Header */}
          <div>
            <h1 className="text-xl font-bold">내 면접</h1>
            <p className="text-sm text-muted-foreground">배정된 면접 일정 및 평가</p>
          </div>

          {/* Today's highlight */}
          {todayInterviews.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <CalendarCheck className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-700 dark:text-blue-400">
                  오늘의 면접 ({todayInterviews.length}건)
                </span>
              </div>
              <div className="space-y-3">
                {todayInterviews.slice(0, 2).map((interview) => renderMobileInterviewCard(interview, true))}
                {todayInterviews.length > 2 && (
                  <p className="text-sm text-center text-muted-foreground">
                    +{todayInterviews.length - 2}건 더보기
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Tab Filter Chips */}
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
            <button
              onClick={() => handleTabChange('today')}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTab === 'today'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              오늘 {todayInterviews.length > 0 && `(${todayInterviews.length})`}
            </button>
            <button
              onClick={() => handleTabChange('upcoming')}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTab === 'upcoming'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              예정
            </button>
            <button
              onClick={() => handleTabChange('pending_eval')}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTab === 'pending_eval'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              평가 대기 {pendingEvalInterviews.length > 0 && `(${pendingEvalInterviews.length})`}
            </button>
            <button
              onClick={() => handleTabChange('completed')}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTab === 'completed'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              완료
            </button>
          </div>

          {/* Interview List */}
          {isLoading || isTodayLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : isError ? (
            <div className="bg-card rounded-xl border p-8 text-center">
              <CalendarCheck className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium">데이터를 불러올 수 없습니다</p>
            </div>
          ) : activeTab === 'today' ? (
            todayInterviews.length === 0 ? (
              <div className="bg-card rounded-xl border p-8 text-center">
                <CalendarCheck className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="font-medium">오늘 예정된 면접이 없습니다</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayInterviews.map((interview) => renderMobileInterviewCard(interview, true))}
              </div>
            )
          ) : activeTab === 'pending_eval' ? (
            pendingEvalInterviews.length === 0 ? (
              <div className="bg-card rounded-xl border p-8 text-center">
                <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="font-medium">평가 대기중인 면접이 없습니다</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingEvalInterviews.map((interview) => renderMobileInterviewCard(interview, true))}
              </div>
            )
          ) : interviews.length === 0 ? (
            <div className="bg-card rounded-xl border p-8 text-center">
              <CalendarCheck className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium">면접 일정이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-3">
              {interviews.map((interview) => renderMobileInterviewCard(interview, activeTab === 'completed'))}
              {totalPages > 1 && (
                <Pagination
                  page={searchState.page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              )}
            </div>
          )}

          {renderScoreDialog()}
        </div>
      </PullToRefreshContainer>
    );
  }

  // Desktop Layout
  return (
    <>
      <PageHeader
        title="내 면접"
        description="배정된 면접 일정과 평가를 관리합니다."
      />

      {/* Today's Interviews Highlight */}
      {todayInterviews.length > 0 && (
        <Card className="mb-6 border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <CalendarCheck className="h-5 w-5" />
              오늘의 면접 ({todayInterviews.length}건)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderInterviewList(todayInterviews, true)}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>면접 일정</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="px-4 pt-2">
            <TabsList>
              <TabsTrigger value="today">
                오늘
                {todayInterviews.length > 0 && ` (${todayInterviews.length})`}
              </TabsTrigger>
              <TabsTrigger value="upcoming">예정</TabsTrigger>
              <TabsTrigger value="pending_eval">
                평가 대기
                {pendingEvalInterviews.length > 0 && ` (${pendingEvalInterviews.length})`}
              </TabsTrigger>
              <TabsTrigger value="completed">완료</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="mt-4 p-4">
            {isLoading || isTodayLoading ? (
              <SkeletonTable rows={3} />
            ) : isError ? (
              <EmptyState
                icon={CalendarCheck}
                title="데이터를 불러올 수 없습니다"
                description="잠시 후 다시 시도해주세요."
              />
            ) : activeTab === 'today' ? (
              todayInterviews.length === 0 ? (
                <EmptyState
                  icon={CalendarCheck}
                  title="오늘 예정된 면접이 없습니다"
                  description="오늘 배정된 면접이 없습니다."
                />
              ) : (
                renderInterviewList(todayInterviews, true)
              )
            ) : activeTab === 'pending_eval' ? (
              pendingEvalInterviews.length === 0 ? (
                <EmptyState
                  icon={CheckCircle}
                  title="평가 대기중인 면접이 없습니다"
                  description="완료된 면접의 평가를 모두 제출했습니다."
                />
              ) : (
                renderInterviewList(pendingEvalInterviews, true)
              )
            ) : interviews.length === 0 ? (
              <EmptyState
                icon={CalendarCheck}
                title="면접 일정이 없습니다"
                description="해당 조건의 면접 일정이 없습니다."
              />
            ) : (
              <>
                {renderInterviewList(interviews, activeTab === 'completed')}
                <div className="mt-4">
                  <Pagination
                    page={searchState.page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                  />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {renderScoreDialog()}
    </>
  );
}
