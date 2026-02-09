import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  ApplicationStatusBadge,
  ApplicationStageBadge,
} from '@/components/common/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { FileText, Search, ArrowLeft, ChevronRight } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import {
  useApplications,
  useApplicationSummary,
  useApplicationSearchParams,
  useJobPostings,
} from '../hooks/useRecruitment';
import type { ApplicationStatus } from '@hr-platform/shared-types';

export default function ApplicationListPage() {
  const { t } = useTranslation('recruitment');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
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
  const totalPages = data?.data?.page?.totalPages ?? 0;
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

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['applications'] });
    await queryClient.invalidateQueries({ queryKey: ['application-summary'] });
  };

  // Mobile Layout
  if (isMobile) {
    return (
      <PullToRefreshContainer onRefresh={handleRefresh}>
        <div className="space-y-4 pb-20">
          {/* Mobile Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">{t('application.title')}</h1>
              <p className="text-sm text-muted-foreground">{t('common.totalApplications', { count: summary.total })}</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate('/recruitment')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>

          {/* Summary Cards - 2x2 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card rounded-xl border p-4">
              <p className="text-xs text-muted-foreground">{t('application.summary.underReview')}</p>
              <p className="text-2xl font-bold text-orange-500">
                {summary.screening + summary.inProgress}
              </p>
            </div>
            <div className="bg-card rounded-xl border p-4">
              <p className="text-xs text-muted-foreground">{t('application.summary.passed')}</p>
              <p className="text-2xl font-bold text-green-500">{summary.passed}</p>
            </div>
            <div className="bg-card rounded-xl border p-4">
              <p className="text-xs text-muted-foreground">{t('application.status.failed')}</p>
              <p className="text-2xl font-bold text-red-500">{summary.failed}</p>
            </div>
            <div className="bg-card rounded-xl border p-4">
              <p className="text-xs text-muted-foreground">{t('application.summary.hired')}</p>
              <p className="text-2xl font-bold text-blue-500">{summary.hired}</p>
            </div>
          </div>

          {/* Job Filter */}
          <Select value={searchState.jobPostingId} onValueChange={setJobPostingId}>
            <SelectTrigger className="w-full h-10">
              <SelectValue placeholder={t('application.allPostings')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">{t('application.allPostings')}</SelectItem>
              {jobs.map((job) => (
                <SelectItem key={job.id} value={job.id}>
                  [{job.jobCode}] {job.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('application.searchPlaceholder')}
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
              {t('application.status.all')}
            </button>
            <button
              onClick={() => handleTabChange('RECEIVED')}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                searchState.status === 'RECEIVED'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {t('application.status.received')}
            </button>
            <button
              onClick={() => handleTabChange('SCREENING')}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                searchState.status === 'SCREENING'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {t('application.status.screening')}
            </button>
            <button
              onClick={() => handleTabChange('IN_PROGRESS')}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                searchState.status === 'IN_PROGRESS'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {t('application.status.inProgress')}
            </button>
            <button
              onClick={() => handleTabChange('PASSED')}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                searchState.status === 'PASSED'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {t('application.status.passed')}
            </button>
            <button
              onClick={() => handleTabChange('FAILED')}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                searchState.status === 'FAILED'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {t('application.status.failed')}
            </button>
          </div>

          {/* Application List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : isError ? (
            <div className="bg-card rounded-xl border p-8 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium">{t('common.cannotLoadData')}</p>
              <p className="text-sm text-muted-foreground mt-1">{t('common.retryLater')}</p>
            </div>
          ) : applications.length === 0 ? (
            <div className="bg-card rounded-xl border p-8 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium">{t('application.noApplications')}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {t('application.noApplicationsFiltered')}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="bg-card rounded-xl border p-4"
                  onClick={() => handleRowClick(app.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-muted-foreground">
                          {app.applicationNumber}
                        </span>
                        <ApplicationStatusBadge status={app.status} />
                      </div>
                      <p className="font-medium">{app.applicantName}</p>
                      <p className="text-xs text-muted-foreground">{app.applicantEmail}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>

                  <div className="space-y-1 text-sm">
                    <p className="text-muted-foreground line-clamp-1">
                      {app.jobCode && `[${app.jobCode}] `}
                      {app.jobTitle}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t">
                    <ApplicationStageBadge stage={app.currentStage} />
                    <span className="text-xs text-muted-foreground">
                      {app.createdAt ? format(new Date(app.createdAt), 'M/d', { locale: ko }) : '-'}
                    </span>
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
        title={t('application.title')}
        description={t('application.description')}
        actions={
          <Button variant="outline" onClick={() => navigate('/recruitment')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('common.postingList')}
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">{t('application.summary.totalApplications')}</p>
              <p className="mt-1 text-3xl font-bold">{summary.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">{t('application.summary.underReview')}</p>
              <p className="mt-1 text-3xl font-bold text-orange-500">
                {summary.screening + summary.inProgress}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">{t('application.summary.passed')}</p>
              <p className="mt-1 text-3xl font-bold text-green-500">{summary.passed}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">{t('application.summary.hired')}</p>
              <p className="mt-1 text-3xl font-bold text-blue-500">{summary.hired}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>{t('application.listTitle')}</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Select value={searchState.jobPostingId} onValueChange={setJobPostingId}>
                <SelectTrigger className="h-10 w-[220px]">
                  <SelectValue placeholder={t('application.allPostings')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t('application.allPostings')}</SelectItem>
                  {jobs.map((job) => (
                    <SelectItem key={job.id} value={job.id}>
                      [{job.jobCode}] {job.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t('application.searchPlaceholder')}
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
              <TabsTrigger value="all">{t('application.status.all')}</TabsTrigger>
              <TabsTrigger value="RECEIVED">{t('application.status.received')}</TabsTrigger>
              <TabsTrigger value="SCREENING">{t('application.status.screening')}</TabsTrigger>
              <TabsTrigger value="IN_PROGRESS">{t('application.status.inProgress')}</TabsTrigger>
              <TabsTrigger value="PASSED">{t('application.status.passed')}</TabsTrigger>
              <TabsTrigger value="FAILED">{t('application.status.failed')}</TabsTrigger>
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
                title={t('common.cannotLoadData')}
                description={t('common.retryLater')}
              />
            ) : applications.length === 0 ? (
              <EmptyState
                icon={FileText}
                title={t('application.noApplications')}
                description={t('application.noApplicationsFiltered')}
              />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          {t('application.table.applicationNumber')}
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          {t('application.table.applicant')}
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          {t('application.table.appliedPosting')}
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          {t('application.table.stage')}
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          {t('application.table.status')}
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          {t('application.table.applicationDate')}
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
                            {app.createdAt ? format(new Date(app.createdAt), 'M/d', { locale: ko }) : '-'}
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
