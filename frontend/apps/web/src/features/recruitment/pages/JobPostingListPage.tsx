import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { SkeletonTable } from '@/components/common/Skeleton';
import { Pagination } from '@/components/common/Pagination';
import { PullToRefreshContainer } from '@/components/mobile';
import {
  JobStatusBadge,
  RecruitmentEmploymentTypeBadge,
} from '@/components/common/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { Briefcase, Plus, Search, Users, ChevronRight, Calendar } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import {
  useJobPostings,
  useJobPostingSummary,
  useJobPostingSearchParams,
} from '../hooks/useRecruitment';
import type { JobStatus } from '@hr-platform/shared-types';

export default function JobPostingListPage() {
  const { t } = useTranslation('recruitment');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [searchInput, setSearchInput] = useState('');
  const debouncedKeyword = useDebounce(searchInput, 300);

  const { params, searchState, setKeyword, setStatus, setPage } = useJobPostingSearchParams();

  useEffect(() => {
    setKeyword(debouncedKeyword);
  }, [debouncedKeyword, setKeyword]);

  const { data: summaryData } = useJobPostingSummary();
  const { data, isLoading, isError } = useJobPostings(params);

  const summary = summaryData?.data ?? { total: 0, draft: 0, pending: 0, published: 0, closed: 0, cancelled: 0, completed: 0 };
  const jobs = data?.data?.content ?? [];
  const totalPages = data?.data?.page?.totalPages ?? 0;

  const handleRowClick = (id: string) => {
    navigate(`/recruitment/jobs/${id}`);
  };

  const handleTabChange = (value: string) => {
    if (value === 'all') {
      setStatus('');
    } else {
      setStatus(value as JobStatus);
    }
  };

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['job-postings'] });
    await queryClient.invalidateQueries({ queryKey: ['job-posting-summary'] });
  };

  // Mobile Layout
  if (isMobile) {
    return (
      <PullToRefreshContainer onRefresh={handleRefresh}>
        <div className="space-y-4 pb-20">
          {/* Mobile Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">{t('jobPosting.title')}</h1>
              <p className="text-sm text-muted-foreground">{t('common.totalPostings', { count: summary.total })}</p>
            </div>
            <Button size="sm" onClick={() => navigate('/recruitment/jobs/new')}>
              <Plus className="mr-1 h-4 w-4" />
              {t('common.register')}
            </Button>
          </div>

          {/* Summary Cards - 2x2 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card rounded-xl border p-4">
              <p className="text-xs text-muted-foreground">{t('jobPosting.summary.inProgress')}</p>
              <p className="text-2xl font-bold text-green-500">{summary.published}</p>
            </div>
            <div className="bg-card rounded-xl border p-4">
              <p className="text-xs text-muted-foreground">{t('jobPosting.summary.closed')}</p>
              <p className="text-2xl font-bold text-orange-500">{summary.closed}</p>
            </div>
            <div className="bg-card rounded-xl border p-4">
              <p className="text-xs text-muted-foreground">{t('jobPosting.summary.completed')}</p>
              <p className="text-2xl font-bold text-blue-500">{summary.completed}</p>
            </div>
            <div className="bg-card rounded-xl border p-4">
              <p className="text-xs text-muted-foreground">{t('jobPosting.summary.draft')}</p>
              <p className="text-2xl font-bold text-gray-500">{summary.draft}</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('jobPosting.searchPlaceholder')}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
            />
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
              {t('common.all')}
            </button>
            <button
              onClick={() => handleTabChange('PUBLISHED')}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                searchState.status === 'PUBLISHED'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {t('jobPosting.status.inProgress')} {summary.published > 0 && `(${summary.published})`}
            </button>
            <button
              onClick={() => handleTabChange('CLOSED')}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                searchState.status === 'CLOSED'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {t('jobPosting.status.closed')}
            </button>
            <button
              onClick={() => handleTabChange('COMPLETED')}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                searchState.status === 'COMPLETED'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {t('jobPosting.status.completed')}
            </button>
            <button
              onClick={() => handleTabChange('DRAFT')}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                searchState.status === 'DRAFT'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {t('jobPosting.status.draft')}
            </button>
          </div>

          {/* Job List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : isError ? (
            <div className="bg-card rounded-xl border p-8 text-center">
              <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium">{t('common.cannotLoadData')}</p>
              <p className="text-sm text-muted-foreground mt-1">{t('common.retryLater')}</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="bg-card rounded-xl border p-8 text-center">
              <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium">{t('jobPosting.noPostings')}</p>
              <p className="text-sm text-muted-foreground mt-1">{t('jobPosting.noPostingsAction')}</p>
              <Button className="mt-4" onClick={() => navigate('/recruitment/jobs/new')}>
                <Plus className="mr-2 h-4 w-4" />
                {t('jobPosting.newPosting')}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-card rounded-xl border p-4"
                  onClick={() => handleRowClick(job.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-muted-foreground">{job.jobCode}</span>
                        <JobStatusBadge status={job.status} />
                      </div>
                      <p className="font-medium line-clamp-1">{job.title}</p>
                      <p className="text-sm text-muted-foreground">{job.departmentName || '-'}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>

                  <div className="flex items-center justify-between text-sm mt-3 pt-3 border-t">
                    <div className="flex items-center gap-3">
                      <RecruitmentEmploymentTypeBadge type={job.employmentType} />
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        <span className="font-medium text-foreground">{job.applicationCount}</span>
                        <span>/ {job.headcount}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>
                        {format(new Date(job.openDate), 'M/d', { locale: ko })}
                        {' - '}
                        {format(new Date(job.closeDate), 'M/d', { locale: ko })}
                      </span>
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
        title={t('title')}
        description={t('description')}
        actions={
          <Button onClick={() => navigate('/recruitment/jobs/new')}>
            <Plus className="mr-2 h-4 w-4" />
            {t('jobPosting.newPosting')}
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">{t('jobPosting.summary.total')}</p>
              <p className="mt-1 text-3xl font-bold">{summary.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">{t('jobPosting.summary.inProgress')}</p>
              <p className="mt-1 text-3xl font-bold text-green-500">{summary.published}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">{t('jobPosting.summary.closed')}</p>
              <p className="mt-1 text-3xl font-bold text-orange-500">{summary.closed}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">{t('jobPosting.summary.completed')}</p>
              <p className="mt-1 text-3xl font-bold text-blue-500">{summary.completed}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">{t('jobPosting.summary.draft')}</p>
              <p className="mt-1 text-3xl font-bold text-gray-500">{summary.draft}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>{t('jobPosting.listTitle')}</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('jobPosting.searchPlaceholder')}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9 w-[200px]"
              />
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
              <TabsTrigger value="all">{t('common.all')}</TabsTrigger>
              <TabsTrigger value="PUBLISHED">
                {t('jobPosting.status.inProgress')} {summary.published > 0 && `(${summary.published})`}
              </TabsTrigger>
              <TabsTrigger value="CLOSED">{t('jobPosting.status.closed')}</TabsTrigger>
              <TabsTrigger value="COMPLETED">{t('jobPosting.status.completed')}</TabsTrigger>
              <TabsTrigger value="DRAFT">
                {t('jobPosting.status.draft')} {summary.draft > 0 && `(${summary.draft})`}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="mt-4">
            {isLoading ? (
              <div className="p-4">
                <SkeletonTable rows={5} />
              </div>
            ) : isError ? (
              <EmptyState
                icon={Briefcase}
                title={t('common.cannotLoadData')}
                description={t('common.retryLater')}
              />
            ) : jobs.length === 0 ? (
              <EmptyState
                icon={Briefcase}
                title={t('jobPosting.noPostings')}
                description={t('jobPosting.noPostingsAction')}
                action={{
                  label: t('jobPosting.newPosting'),
                  onClick: () => navigate('/recruitment/jobs/new'),
                }}
              />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          {t('jobPosting.table.postingNumber')}
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          {t('jobPosting.table.title')}
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          {t('jobPosting.table.department')}
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          {t('jobPosting.table.employmentType')}
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          {t('jobPosting.table.headcountAndApplications')}
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          {t('jobPosting.table.period')}
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          {t('jobPosting.table.status')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobs.map((job) => (
                        <tr
                          key={job.id}
                          onClick={() => handleRowClick(job.id)}
                          className="border-b cursor-pointer transition-colors hover:bg-muted/50"
                        >
                          <td className="px-4 py-3 font-mono text-sm">
                            {job.jobCode}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium max-w-[250px] truncate">
                            {job.title}
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {job.departmentName || '-'}
                          </td>
                          <td className="px-4 py-3">
                            <RecruitmentEmploymentTypeBadge type={job.employmentType} />
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{job.applicationCount}</span>
                              <span className="text-muted-foreground">/ {job.headcount}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {format(new Date(job.openDate), 'M/d', { locale: ko })}
                            {' - '}
                            {format(new Date(job.closeDate), 'M/d', { locale: ko })}
                          </td>
                          <td className="px-4 py-3">
                            <JobStatusBadge status={job.status} />
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
