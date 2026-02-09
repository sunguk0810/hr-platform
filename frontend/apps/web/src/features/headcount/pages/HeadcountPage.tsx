import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { SkeletonTable } from '@/components/common/Skeleton';
import { Pagination } from '@/components/common/Pagination';
import { PullToRefreshContainer } from '@/components/mobile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Users, Plus, TrendingUp, TrendingDown, Minus, BarChart3, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/useMediaQuery';
import {
  useHeadcountPlans,
  useHeadcountSummary,
  useHeadcountPlanSearchParams,
} from '../hooks/useHeadcount';
import type { HeadcountStatus } from '@hr-platform/shared-types';
import { HEADCOUNT_STATUS_LABELS } from '@hr-platform/shared-types';

const STATUS_COLORS: Record<HeadcountStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  APPROVED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  CLOSED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

export default function HeadcountPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const { t } = useTranslation('headcount');
  const currentYear = new Date().getFullYear();
  const years = [currentYear + 1, currentYear, currentYear - 1, currentYear - 2];

  const {
    params,
    searchState,
    setYear,
    setStatus,
    setPage,
    resetFilters,
  } = useHeadcountPlanSearchParams();

  const { data: plansData, isLoading } = useHeadcountPlans(params);
  const { data: summaryData, isLoading: isSummaryLoading } = useHeadcountSummary(searchState.year);

  const plans = plansData?.data?.content ?? [];
  const totalPages = plansData?.data?.page?.totalPages ?? 0;
  const summary = summaryData?.data;

  const handleTabChange = (value: string) => {
    if (value === 'all') {
      setStatus('');
    } else {
      setStatus(value as HeadcountStatus);
    }
  };

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['headcount-plans'] });
    await queryClient.invalidateQueries({ queryKey: ['headcount-summary'] });
  };

  // Mobile Layout
  if (isMobile) {
    return (
      <PullToRefreshContainer onRefresh={handleRefresh}>
        <div className="space-y-4 pb-20">
          {/* Mobile Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">{t('title')}</h1>
              <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
            </div>
            <Button size="sm" onClick={() => navigate('/headcount/plans/new')}>
              <Plus className="mr-1 h-4 w-4" />
              {t('empty.createPlan')}
            </Button>
          </div>

          {/* Summary Cards - 2x2 Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card rounded-xl border p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <span className="text-xs text-muted-foreground">{t('summary.authorized')}</span>
              </div>
              <p className="text-2xl font-bold">
                {isSummaryLoading ? '-' : (summary?.totalPlannedCount ?? 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-card rounded-xl border p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                  <Users className="h-4 w-4 text-green-600" />
                </div>
                <span className="text-xs text-muted-foreground">{t('summary.actual')}</span>
              </div>
              <p className="text-2xl font-bold">
                {isSummaryLoading ? '-' : (summary?.totalCurrentCount ?? 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-card rounded-xl border p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-lg',
                  (summary?.totalVariance ?? 0) >= 0
                    ? 'bg-amber-100 dark:bg-amber-900/30'
                    : 'bg-red-100 dark:bg-red-900/30'
                )}>
                  {(summary?.totalVariance ?? 0) > 0 ? (
                    <TrendingUp className="h-4 w-4 text-amber-600" />
                  ) : (summary?.totalVariance ?? 0) < 0 ? (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  ) : (
                    <Minus className="h-4 w-4 text-gray-600" />
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{t('summary.difference')}</span>
              </div>
              <p className={cn(
                'text-2xl font-bold',
                (summary?.totalVariance ?? 0) > 0 && 'text-amber-600',
                (summary?.totalVariance ?? 0) < 0 && 'text-red-600'
              )}>
                {isSummaryLoading ? '-' : (
                  <>
                    {(summary?.totalVariance ?? 0) > 0 && '+'}
                    {(summary?.totalVariance ?? 0).toLocaleString()}
                  </>
                )}
              </p>
            </div>
            <div className="bg-card rounded-xl border p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <BarChart3 className="h-4 w-4 text-purple-600" />
                </div>
                <span className="text-xs text-muted-foreground">{t('summary.fillRate')}</span>
              </div>
              <p className="text-2xl font-bold">
                {isSummaryLoading ? '-' : (
                  summary?.totalPlannedCount
                    ? `${Math.round((summary.totalCurrentCount / summary.totalPlannedCount) * 100)}%`
                    : '-'
                )}
              </p>
            </div>
          </div>

          {/* Year Selector */}
          <div className="flex items-center gap-2">
            <Select
              value={String(searchState.year)}
              onValueChange={(value) => setYear(Number(value))}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder={t('year.label')} />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {t('year.value', { year })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Mobile Tab Filters */}
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
            {[
              { value: '', label: t('tabs.all') },
              { value: 'DRAFT', label: t('tabs.draft') },
              { value: 'APPROVED', label: t('tabs.approved') },
              { value: 'ACTIVE', label: t('tabs.active') },
            ].map((item) => (
              <button
                key={item.value}
                onClick={() => handleTabChange(item.value || 'all')}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  (searchState.status || '') === item.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Plans List */}
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
              ))}
            </div>
          ) : plans.length === 0 ? (
            <EmptyState
              icon={Users}
              title={searchState.status ? t('empty.noResults') : t('empty.noPlans')}
              description={searchState.status ? t('empty.noResultsDesc') : t('empty.noPlansDesc')}
              action={
                searchState.status
                  ? { label: t('empty.resetFilter'), onClick: resetFilters }
                  : { label: t('empty.createPlan'), onClick: () => navigate('/headcount/plans/new') }
              }
            />
          ) : (
            <div className="space-y-3">
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => navigate(`/headcount/plans/${plan.id}`)}
                  className="w-full bg-card rounded-xl border p-4 text-left transition-colors active:bg-muted"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={cn(STATUS_COLORS[plan.status], 'text-xs')}>
                          {HEADCOUNT_STATUS_LABELS[plan.status]}
                        </Badge>
                      </div>
                      <p className="font-medium text-sm">{plan.departmentName}</p>
                      <p className="text-xs text-muted-foreground">{plan.gradeName}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="text-xs">
                          <span className="text-muted-foreground">{t('summary.authorized')}</span>
                          <span className="ml-1 font-medium">{plan.plannedCount}</span>
                        </div>
                        <div className="text-xs">
                          <span className="text-muted-foreground">{t('summary.actual')}</span>
                          <span className="ml-1 font-medium">{plan.currentCount}</span>
                        </div>
                        <div className={cn(
                          'text-xs font-medium',
                          plan.variance > 0 && 'text-amber-600',
                          plan.variance < 0 && 'text-red-600'
                        )}>
                          {plan.variance > 0 && '+'}
                          {plan.variance}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                  </div>
                </button>
              ))}
              {totalPages > 1 && (
                <Pagination page={searchState.page} totalPages={totalPages} onPageChange={setPage} />
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
          <Button onClick={() => navigate('/headcount/plans/new')}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            {t('plan.create')}
          </Button>
        }
      />

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6" role="region" aria-label={t('summary.title')}>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Users className="h-6 w-6 text-blue-600" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground" id="planned-label">{t('summary.authorized')}</p>
                <p className="text-2xl font-bold" aria-labelledby="planned-label">
                  {isSummaryLoading ? '-' : (summary?.totalPlannedCount ?? 0).toLocaleString()}
                  <span className="sr-only">명</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                <Users className="h-6 w-6 text-green-600" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground" id="actual-label">{t('summary.actual')}</p>
                <p className="text-2xl font-bold" aria-labelledby="actual-label">
                  {isSummaryLoading ? '-' : (summary?.totalCurrentCount ?? 0).toLocaleString()}
                  <span className="sr-only">명</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className={cn(
                'flex h-12 w-12 items-center justify-center rounded-lg',
                (summary?.totalVariance ?? 0) >= 0
                  ? 'bg-amber-100 dark:bg-amber-900/30'
                  : 'bg-red-100 dark:bg-red-900/30'
              )}>
                {(summary?.totalVariance ?? 0) > 0 ? (
                  <TrendingUp className="h-6 w-6 text-amber-600" aria-hidden="true" />
                ) : (summary?.totalVariance ?? 0) < 0 ? (
                  <TrendingDown className="h-6 w-6 text-red-600" aria-hidden="true" />
                ) : (
                  <Minus className="h-6 w-6 text-gray-600" aria-hidden="true" />
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground" id="variance-label">{t('summary.difference')}</p>
                <p className={cn(
                  'text-2xl font-bold',
                  (summary?.totalVariance ?? 0) > 0 && 'text-amber-600',
                  (summary?.totalVariance ?? 0) < 0 && 'text-red-600'
                )} aria-labelledby="variance-label">
                  {isSummaryLoading ? '-' : (
                    <>
                      {(summary?.totalVariance ?? 0) > 0 && '+'}
                      {(summary?.totalVariance ?? 0).toLocaleString()}
                      <span className="sr-only">명</span>
                    </>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <BarChart3 className="h-6 w-6 text-purple-600" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground" id="utilization-label">{t('summary.fillRate')}</p>
                <p className="text-2xl font-bold" aria-labelledby="utilization-label">
                  {isSummaryLoading ? '-' : (
                    summary?.totalPlannedCount
                      ? `${Math.round((summary.totalCurrentCount / summary.totalPlannedCount) * 100)}%`
                      : '-'
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" aria-hidden="true" />
              {t('plan.title')}
            </CardTitle>
            <div className="flex gap-2">
              <Select
                value={String(searchState.year)}
                onValueChange={(value) => setYear(Number(value))}
              >
                <SelectTrigger className="w-[120px]" aria-label={t('year.select')}>
                  <SelectValue placeholder={t('year.label')} />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {t('year.value', { year })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <TabsTrigger value="all">{t('tabs.all')}</TabsTrigger>
              <TabsTrigger value="DRAFT">{t('tabs.draft')}</TabsTrigger>
              <TabsTrigger value="APPROVED">{t('tabs.approved')}</TabsTrigger>
              <TabsTrigger value="ACTIVE">{t('tabs.active')}</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="mt-4">
            {isLoading ? (
              <div className="p-4">
                <SkeletonTable rows={5} />
              </div>
            ) : plans.length === 0 ? (
              <EmptyState
                icon={Users}
                title={
                  searchState.status
                    ? t('empty.noResults')
                    : t('empty.noPlans')
                }
                description={
                  searchState.status
                    ? t('empty.noResultsDesc')
                    : t('empty.noPlansDesc')
                }
                action={
                  searchState.status
                    ? { label: t('empty.resetFilter'), onClick: resetFilters }
                    : { label: t('empty.createPlan'), onClick: () => navigate('/headcount/plans/new') }
                }
              />
            ) : (
              <>
                <div className="overflow-x-auto" role="region" aria-label={t('plan.list')}>
                  <table className="w-full" role="grid" aria-label={t('plan.title')}>
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          {t('table.department')}
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          {t('table.grade')}
                        </th>
                        <th scope="col" className="px-4 py-3 text-right text-sm font-medium text-muted-foreground w-[100px]">
                          {t('table.authorized')}
                        </th>
                        <th scope="col" className="px-4 py-3 text-right text-sm font-medium text-muted-foreground w-[100px]">
                          {t('table.actual')}
                        </th>
                        <th scope="col" className="px-4 py-3 text-right text-sm font-medium text-muted-foreground w-[100px]">
                          {t('table.difference')}
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-muted-foreground w-[100px]">
                          {t('table.status')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {plans.map((plan) => (
                        <tr
                          key={plan.id}
                          className="border-b cursor-pointer transition-colors hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                          onClick={() => navigate(`/headcount/plans/${plan.id}`)}
                          onKeyDown={(e) => e.key === 'Enter' && navigate(`/headcount/plans/${plan.id}`)}
                          tabIndex={0}
                          role="row"
                          aria-label={`${plan.departmentName} ${plan.gradeName}`}
                        >
                          <td className="px-4 py-3 text-sm">
                            <div>
                              <p className="font-medium">{plan.departmentName}</p>
                              <p className="text-xs text-muted-foreground">{plan.departmentCode}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {plan.gradeName}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-medium">
                            {plan.plannedCount}
                          </td>
                          <td className="px-4 py-3 text-sm text-right">
                            {plan.currentCount}
                          </td>
                          <td className={cn(
                            'px-4 py-3 text-sm text-right font-medium',
                            plan.variance > 0 && 'text-amber-600',
                            plan.variance < 0 && 'text-red-600'
                          )}>
                            {plan.variance > 0 && '+'}
                            {plan.variance}
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={cn(STATUS_COLORS[plan.status])} role="status">
                              {HEADCOUNT_STATUS_LABELS[plan.status]}
                            </Badge>
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
