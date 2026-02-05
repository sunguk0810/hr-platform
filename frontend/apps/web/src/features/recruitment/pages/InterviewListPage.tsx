import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { CalendarCheck, ArrowLeft, Users, MapPin, Video, ChevronRight, Clock } from 'lucide-react';
import {
  useInterviews,
  useInterviewSummary,
  useInterviewSearchParams,
} from '../hooks/useRecruitment';
import type { InterviewStatus } from '@hr-platform/shared-types';

export default function InterviewListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  const { params, searchState, setStatus, setPage } = useInterviewSearchParams();

  const { data: summaryData } = useInterviewSummary();
  const { data, isLoading, isError } = useInterviews(params);

  const summary = summaryData?.data ?? { total: 0, scheduled: 0, completed: 0, cancelled: 0, today: 0 };
  const interviews = data?.data?.content ?? [];
  const totalPages = data?.data?.totalPages ?? 0;

  const handleRowClick = (applicationId: string) => {
    navigate(`/recruitment/applications/${applicationId}`);
  };

  const handleTabChange = (value: string) => {
    if (value === 'all') {
      setStatus('');
    } else {
      setStatus(value as InterviewStatus);
    }
  };

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['interviews'] });
    await queryClient.invalidateQueries({ queryKey: ['interview-summary'] });
  };

  // Mobile Layout
  if (isMobile) {
    return (
      <PullToRefreshContainer onRefresh={handleRefresh}>
        <div className="space-y-4 pb-20">
          {/* Mobile Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">면접 일정</h1>
              <p className="text-sm text-muted-foreground">총 {summary.total}건</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => navigate('/recruitment')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>

          {/* Summary Cards - 2x2 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-200 p-4">
              <p className="text-xs text-blue-600 dark:text-blue-400">오늘 예정</p>
              <p className="text-2xl font-bold text-blue-600">{summary.today}</p>
            </div>
            <div className="bg-card rounded-xl border p-4">
              <p className="text-xs text-muted-foreground">예정</p>
              <p className="text-2xl font-bold text-orange-500">{summary.scheduled}</p>
            </div>
            <div className="bg-card rounded-xl border p-4">
              <p className="text-xs text-muted-foreground">완료</p>
              <p className="text-2xl font-bold text-green-500">{summary.completed}</p>
            </div>
            <div className="bg-card rounded-xl border p-4">
              <p className="text-xs text-muted-foreground">취소</p>
              <p className="text-2xl font-bold text-gray-500">{summary.cancelled}</p>
            </div>
          </div>

          {/* Status Filter Chips */}
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
            <button
              onClick={() => handleTabChange('all')}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                !searchState.status
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              전체
            </button>
            <button
              onClick={() => handleTabChange('SCHEDULED')}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                searchState.status === 'SCHEDULED'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              예정
            </button>
            <button
              onClick={() => handleTabChange('CONFIRMED')}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                searchState.status === 'CONFIRMED'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              확정
            </button>
            <button
              onClick={() => handleTabChange('COMPLETED')}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                searchState.status === 'COMPLETED'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              완료
            </button>
            <button
              onClick={() => handleTabChange('CANCELLED')}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                searchState.status === 'CANCELLED'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              취소
            </button>
          </div>

          {/* Interview List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : isError ? (
            <div className="bg-card rounded-xl border p-8 text-center">
              <CalendarCheck className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium">데이터를 불러올 수 없습니다</p>
            </div>
          ) : interviews.length === 0 ? (
            <div className="bg-card rounded-xl border p-8 text-center">
              <CalendarCheck className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium">면접 일정이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-3">
              {interviews.map((interview) => (
                <div
                  key={interview.id}
                  className="bg-card rounded-xl border p-4"
                  onClick={() => handleRowClick(interview.applicationId)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <InterviewTypeBadge type={interview.interviewType} />
                        <InterviewStatusBadge status={interview.status} />
                      </div>
                      <p className="font-medium">{interview.applicantName || '-'}</p>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {interview.jobTitle || '-'}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>

                  <div className="space-y-2 text-sm mt-3 pt-3 border-t">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-medium">
                        {format(new Date(interview.scheduledAt), 'M월 d일 (E) HH:mm', { locale: ko })}
                      </span>
                      <span className="text-muted-foreground">({interview.durationMinutes}분)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      {interview.interviewerNames && interview.interviewerNames.length > 0 && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Users className="h-3.5 w-3.5" />
                          <span>면접관 {interview.interviewerNames.length}명</span>
                        </div>
                      )}
                      {interview.meetingUrl ? (
                        <div className="flex items-center gap-1 text-blue-600">
                          <Video className="h-3.5 w-3.5" />
                          <span>화상</span>
                        </div>
                      ) : interview.location ? (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" />
                          <span className="truncate max-w-[120px]">{interview.location}</span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}

              {totalPages > 1 && (
                <Pagination
                  page={searchState.page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              )}
            </div>
          )}
        </div>
      </PullToRefreshContainer>
    );
  }

  // Desktop Layout
  return (
    <>
      <PageHeader
        title="면접 일정 관리"
        description="채용 면접 일정을 조회하고 관리합니다."
        actions={
          <Button variant="outline" onClick={() => navigate('/recruitment')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            공고 목록
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">전체</p>
              <p className="mt-1 text-3xl font-bold">{summary.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">오늘 예정</p>
              <p className="mt-1 text-3xl font-bold text-blue-600">{summary.today}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">예정</p>
              <p className="mt-1 text-3xl font-bold text-orange-500">{summary.scheduled}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">완료</p>
              <p className="mt-1 text-3xl font-bold text-green-500">{summary.completed}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>면접 일정 목록</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs
            value={searchState.status || 'all'}
            onValueChange={handleTabChange}
            className="px-4 pt-2"
          >
            <TabsList>
              <TabsTrigger value="all">전체</TabsTrigger>
              <TabsTrigger value="SCHEDULED">
                예정 {summary.scheduled > 0 && `(${summary.scheduled})`}
              </TabsTrigger>
              <TabsTrigger value="CONFIRMED">확정</TabsTrigger>
              <TabsTrigger value="COMPLETED">완료</TabsTrigger>
              <TabsTrigger value="CANCELLED">취소</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="mt-4">
            {isLoading ? (
              <div className="p-4">
                <SkeletonTable rows={5} />
              </div>
            ) : isError ? (
              <EmptyState
                icon={CalendarCheck}
                title="데이터를 불러올 수 없습니다"
                description="잠시 후 다시 시도해주세요."
              />
            ) : interviews.length === 0 ? (
              <EmptyState
                icon={CalendarCheck}
                title="면접 일정이 없습니다"
                description="등록된 면접 일정이 없습니다."
              />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          일시
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          지원자
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          공고
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          유형
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          면접관
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          장소/URL
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          상태
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {interviews.map((interview) => (
                        <tr
                          key={interview.id}
                          onClick={() => handleRowClick(interview.applicationId)}
                          className="border-b cursor-pointer transition-colors hover:bg-muted/50"
                        >
                          <td className="px-4 py-3">
                            <div>
                              <div className="text-sm font-medium">
                                {format(new Date(interview.scheduledAt), 'M월 d일 (E)', {
                                  locale: ko,
                                })}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {format(new Date(interview.scheduledAt), 'HH:mm')}
                                <span> ({interview.durationMinutes}분)</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium">
                            {interview.applicantName || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground max-w-[150px] truncate">
                            {interview.jobTitle || '-'}
                          </td>
                          <td className="px-4 py-3">
                            <InterviewTypeBadge type={interview.interviewType} />
                          </td>
                          <td className="px-4 py-3">
                            {interview.interviewerNames && interview.interviewerNames.length > 0 ? (
                              <div className="flex items-center gap-1 text-sm">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span>{interview.interviewerNames.length}명</span>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {interview.meetingUrl ? (
                              <div className="flex items-center gap-1 text-sm text-blue-600">
                                <Video className="h-4 w-4" />
                                <span>화상</span>
                              </div>
                            ) : interview.location ? (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <MapPin className="h-4 w-4" />
                                <span className="max-w-[100px] truncate">{interview.location}</span>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <InterviewStatusBadge status={interview.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  page={searchState.page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
