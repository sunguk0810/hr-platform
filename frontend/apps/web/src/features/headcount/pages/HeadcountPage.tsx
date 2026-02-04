import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { SkeletonTable } from '@/components/common/Skeleton';
import { Pagination } from '@/components/common/Pagination';
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
import { Users, Plus, TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
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
  const totalPages = plansData?.data?.totalPages ?? 0;
  const summary = summaryData?.data;

  const handleTabChange = (value: string) => {
    if (value === 'all') {
      setStatus('');
    } else {
      setStatus(value as HeadcountStatus);
    }
  };

  return (
    <>
      <PageHeader
        title="정현원 관리"
        description="부서별 정현원 계획 및 현황을 관리합니다."
        actions={
          <Button onClick={() => navigate('/headcount/plans/new')}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            정현원 계획 등록
          </Button>
        }
      />

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6" role="region" aria-label="정현원 요약">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Users className="h-6 w-6 text-blue-600" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground" id="planned-label">정현원</p>
                <p className="text-2xl font-bold" aria-labelledby="planned-label">
                  {isSummaryLoading ? '-' : (summary?.totalPlanned ?? 0).toLocaleString()}
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
                <p className="text-sm text-muted-foreground" id="actual-label">실현원</p>
                <p className="text-2xl font-bold" aria-labelledby="actual-label">
                  {isSummaryLoading ? '-' : (summary?.totalActual ?? 0).toLocaleString()}
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
                <p className="text-sm text-muted-foreground" id="variance-label">정실 차이</p>
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
                <p className="text-sm text-muted-foreground" id="utilization-label">충원율</p>
                <p className="text-2xl font-bold" aria-labelledby="utilization-label">
                  {isSummaryLoading ? '-' : (
                    summary?.totalPlanned
                      ? `${Math.round((summary.totalActual / summary.totalPlanned) * 100)}%`
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
              정현원 계획
            </CardTitle>
            <div className="flex gap-2">
              <Select
                value={String(searchState.year)}
                onValueChange={(value) => setYear(Number(value))}
              >
                <SelectTrigger className="w-[120px]" aria-label="연도 선택">
                  <SelectValue placeholder="연도" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}년
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
              <TabsTrigger value="all">전체</TabsTrigger>
              <TabsTrigger value="DRAFT">초안</TabsTrigger>
              <TabsTrigger value="APPROVED">승인됨</TabsTrigger>
              <TabsTrigger value="ACTIVE">적용중</TabsTrigger>
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
                    ? '검색 결과가 없습니다'
                    : '정현원 계획이 없습니다'
                }
                description={
                  searchState.status
                    ? '다른 필터를 선택해 보세요.'
                    : '새로운 정현원 계획을 등록하세요.'
                }
                action={
                  searchState.status
                    ? { label: '필터 초기화', onClick: resetFilters }
                    : { label: '계획 등록', onClick: () => navigate('/headcount/plans/new') }
                }
              />
            ) : (
              <>
                <div className="overflow-x-auto" role="region" aria-label="정현원 계획 목록">
                  <table className="w-full" role="grid" aria-label="정현원 계획">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          부서
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          직급
                        </th>
                        <th scope="col" className="px-4 py-3 text-right text-sm font-medium text-muted-foreground w-[100px]">
                          정현원
                        </th>
                        <th scope="col" className="px-4 py-3 text-right text-sm font-medium text-muted-foreground w-[100px]">
                          실현원
                        </th>
                        <th scope="col" className="px-4 py-3 text-right text-sm font-medium text-muted-foreground w-[100px]">
                          차이
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-muted-foreground w-[100px]">
                          상태
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
                            {plan.actualCount}
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
