import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { SkeletonTable } from '@/components/common/Skeleton';
import { Pagination } from '@/components/common/Pagination';
import {
  ApplicationStatusBadge,
  ApplicationStageBadge,
} from '@/components/common/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Search, ArrowLeft } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import {
  useApplications,
  useApplicationSummary,
  useApplicationSearchParams,
  useJobPostings,
} from '../hooks/useRecruitment';
import type { ApplicationStatus } from '@hr-platform/shared-types';

export default function ApplicationListPage() {
  const navigate = useNavigate();
  const [urlParams] = useSearchParams();
  const initialJobId = urlParams.get('jobPostingId') || '';

  const [searchInput, setSearchInput] = useState('');
  const debouncedKeyword = useDebounce(searchInput, 300);

  const {
    params,
    searchState,
    setKeyword,
    setJobPostingId,
    setStatus,
    setPage,
  } = useApplicationSearchParams();

  useEffect(() => {
    if (initialJobId) {
      setJobPostingId(initialJobId);
    }
  }, [initialJobId, setJobPostingId]);

  useEffect(() => {
    setKeyword(debouncedKeyword);
  }, [debouncedKeyword, setKeyword]);

  const { data: summaryData } = useApplicationSummary(searchState.jobPostingId || undefined);
  const { data, isLoading, isError } = useApplications(params);
  const { data: jobsData } = useJobPostings({ size: 100 });

  const summary = summaryData?.data ?? {
    total: 0,
    received: 0,
    screening: 0,
    inProgress: 0,
    passed: 0,
    failed: 0,
    hired: 0,
  };
  const applications = data?.data?.content ?? [];
  const totalPages = data?.data?.totalPages ?? 0;
  const jobs = jobsData?.data?.content ?? [];

  const handleRowClick = (id: string) => {
    navigate(`/recruitment/applications/${id}`);
  };

  const handleTabChange = (value: string) => {
    if (value === 'all') {
      setStatus('');
    } else {
      setStatus(value as ApplicationStatus);
    }
  };

  return (
    <>
      <PageHeader
        title="지원서 관리"
        description="채용 지원서를 심사하고 관리합니다."
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
              <p className="text-sm text-muted-foreground">전체 지원</p>
              <p className="mt-1 text-3xl font-bold">{summary.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">심사중</p>
              <p className="mt-1 text-3xl font-bold text-orange-500">
                {summary.screening + summary.inProgress}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">합격</p>
              <p className="mt-1 text-3xl font-bold text-green-500">{summary.passed}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">채용확정</p>
              <p className="mt-1 text-3xl font-bold text-blue-500">{summary.hired}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>지원서 목록</CardTitle>
            <div className="flex flex-wrap gap-2">
              <select
                value={searchState.jobPostingId}
                onChange={(e) => setJobPostingId(e.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">전체 공고</option>
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    [{job.jobCode}] {job.title}
                  </option>
                ))}
              </select>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="이름, 이메일..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9 w-[180px]"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs
            value={searchState.status || 'all'}
            onValueChange={handleTabChange}
            className="px-4 pt-2"
          >
            <TabsList>
              <TabsTrigger value="all">전체</TabsTrigger>
              <TabsTrigger value="RECEIVED">접수</TabsTrigger>
              <TabsTrigger value="SCREENING">서류심사</TabsTrigger>
              <TabsTrigger value="IN_PROGRESS">진행중</TabsTrigger>
              <TabsTrigger value="PASSED">합격</TabsTrigger>
              <TabsTrigger value="FAILED">불합격</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="mt-4">
            {isLoading ? (
              <div className="p-4">
                <SkeletonTable rows={5} />
              </div>
            ) : isError ? (
              <EmptyState
                icon={FileText}
                title="데이터를 불러올 수 없습니다"
                description="잠시 후 다시 시도해주세요."
              />
            ) : applications.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="지원서가 없습니다"
                description="선택한 조건에 맞는 지원서가 없습니다."
              />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          지원번호
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          지원자
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          지원 공고
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          단계
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          상태
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          지원일
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {applications.map((app) => (
                        <tr
                          key={app.id}
                          onClick={() => handleRowClick(app.id)}
                          className="border-b cursor-pointer transition-colors hover:bg-muted/50"
                        >
                          <td className="px-4 py-3 font-mono text-sm">
                            {app.applicationNumber}
                          </td>
                          <td className="px-4 py-3">
                            <div>
                              <div className="text-sm font-medium">{app.applicantName}</div>
                              <div className="text-xs text-muted-foreground">
                                {app.applicantEmail}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm max-w-[200px] truncate">
                            {app.jobCode && (
                              <span className="text-muted-foreground">[{app.jobCode}] </span>
                            )}
                            {app.jobTitle}
                          </td>
                          <td className="px-4 py-3">
                            <ApplicationStageBadge stage={app.currentStage} />
                          </td>
                          <td className="px-4 py-3">
                            <ApplicationStatusBadge status={app.status} />
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {format(new Date(app.appliedAt), 'M/d', { locale: ko })}
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
