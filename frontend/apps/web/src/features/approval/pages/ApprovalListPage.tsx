import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { ApprovalStatusBadge } from '@/components/common/StatusBadge';
import { SkeletonTable } from '@/components/common/Skeleton';
import { Pagination } from '@/components/common/Pagination';
import { SimpleInfiniteList } from '@/components/common/InfiniteVirtualList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileCheck, Plus, Search, AlertCircle, RefreshCw } from 'lucide-react';
import {
  useApprovalList,
  useInfiniteApprovalList,
  useApprovalSummary,
  useApprovalSearchParams,
  useApprove,
  useReject,
} from '../hooks/useApprovals';
import {
  ApprovalCard,
  ApprovalFilterTabs,
  ApprovalSummaryCards,
  ApprovalDetailSheet,
} from '../components/mobile';
import { SplitView, SplitViewPanel } from '@/components/layout/SplitView';
import { useIsMobile, useIsTablet } from '@/hooks/useMediaQuery';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { cn } from '@/lib/utils';
import type { ApprovalType, ApprovalListItem } from '@hr-platform/shared-types';

const APPROVAL_TYPE_LABELS: Record<ApprovalType, string> = {
  LEAVE_REQUEST: '휴가신청',
  EXPENSE: '경비청구',
  OVERTIME: '초과근무',
  PERSONNEL: '인사관련',
  GENERAL: '일반기안',
};

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export default function ApprovalListPage() {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');
  const debouncedKeyword = useDebounce(searchInput, 300);
  const [selectedApproval, setSelectedApproval] = useState<ApprovalListItem | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  const {
    params,
    searchState,
    setKeyword,
    setType,
    setTab,
    setPage,
  } = useApprovalSearchParams();

  useEffect(() => {
    setKeyword(debouncedKeyword);
  }, [debouncedKeyword, setKeyword]);

  const { data: summaryData, refetch: refetchSummary } = useApprovalSummary();

  // Desktop/Tablet: Use pagination
  const { data, isLoading, isError, refetch: refetchList } = useApprovalList(params);

  // Mobile: Use infinite scroll
  const infiniteParams = useMemo(() => ({
    size: params.size,
    ...(params.keyword && { keyword: params.keyword }),
    ...(params.type && { type: params.type }),
    ...(params.status && { status: params.status }),
    ...(params.tab && { tab: params.tab }),
  }), [params]);

  const {
    data: infiniteData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isInfiniteLoading,
    isError: isInfiniteError,
    refetch: refetchInfinite,
  } = useInfiniteApprovalList(infiniteParams);

  const summary = summaryData?.data ?? { pending: 0, approved: 0, rejected: 0, draft: 0 };
  const approvals = data?.data?.content ?? [];
  const totalPages = data?.data?.totalPages ?? 0;

  // Flatten infinite query pages for mobile
  const mobileApprovals = useMemo(() => {
    if (!infiniteData?.pages) return [];
    return infiniteData.pages.flatMap(page => page?.data?.content ?? []);
  }, [infiniteData]);

  // Swipe action mutations
  const approveMutation = useApprove();
  const rejectMutation = useReject();

  const handleSwipeApprove = (id: string) => {
    approveMutation.mutate({ id });
  };

  const handleSwipeReject = (id: string) => {
    rejectMutation.mutate({ id, data: { comment: '스와이프로 반려됨' } });
  };

  // Pull to refresh for mobile
  const handleRefresh = async () => {
    if (isMobile) {
      await Promise.all([refetchSummary(), refetchInfinite()]);
    } else {
      await Promise.all([refetchSummary(), refetchList()]);
    }
  };

  const { isPulling, isRefreshing, pullProgress, pullDistance, handlers } = usePullToRefresh({
    onRefresh: handleRefresh,
  });

  const handleRowClick = (id: string) => {
    navigate(`/approvals/${id}`);
  };

  const handleMobileCardClick = (approval: ApprovalListItem) => {
    setSelectedApproval(approval);
    setDetailSheetOpen(true);
  };

  const handleTabChange = (value: string) => {
    setTab(value as 'pending' | 'requested' | 'completed' | 'draft' | '');
  };

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="min-h-full" {...handlers}>
        {/* Pull to refresh indicator */}
        {(isPulling || isRefreshing) && (
          <div
            className="flex justify-center items-center py-4"
            style={{ height: pullDistance }}
          >
            <RefreshCw
              className={cn(
                'h-6 w-6 text-primary transition-transform',
                isRefreshing && 'animate-spin',
                pullProgress >= 1 && !isRefreshing && 'text-green-500'
              )}
              style={{
                transform: `rotate(${pullProgress * 180}deg)`,
              }}
            />
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold">전자결재</h1>
            <p className="text-sm text-muted-foreground">결재 문서 관리</p>
          </div>
          <Button size="sm" onClick={() => navigate('/approvals/new')}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="mb-4">
          <ApprovalSummaryCards
            pending={summary.pending}
            approved={summary.approved}
            rejected={summary.rejected}
            draft={summary.draft}
            onItemClick={(type) => {
              if (type === 'pending') setTab('pending');
              else if (type === 'draft') setTab('draft');
              else if (type === 'approved' || type === 'rejected') setTab('completed');
            }}
          />
        </div>

        {/* Filter Tabs */}
        <div className="mb-4">
          <ApprovalFilterTabs
            value={searchState.tab as 'pending' | 'requested' | 'completed' | 'draft' | ''}
            onChange={handleTabChange}
            counts={{ pending: summary.pending, draft: summary.draft }}
          />
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="문서번호, 제목, 기안자..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Approval List - Infinite Scroll */}
        {isInfiniteLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-28 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        ) : isInfiniteError ? (
          <EmptyState
            icon={FileCheck}
            title="데이터를 불러올 수 없습니다"
            description="잠시 후 다시 시도해주세요."
          />
        ) : mobileApprovals.length === 0 ? (
          <EmptyState
            icon={FileCheck}
            title={
              searchState.tab === 'pending' ? '결재 대기 문서가 없습니다' :
              searchState.tab === 'requested' ? '요청한 문서가 없습니다' :
              searchState.tab === 'completed' ? '완료된 문서가 없습니다' :
              searchState.tab === 'draft' ? '임시저장 문서가 없습니다' :
              '결재 문서가 없습니다'
            }
            description={
              searchState.tab === 'requested'
                ? '새 문서를 작성하여 결재를 요청하세요.'
                : '결재할 문서가 있으면 여기에 표시됩니다.'
            }
            action={
              searchState.tab === 'requested'
                ? {
                    label: '새 문서 작성',
                    onClick: () => navigate('/approvals/new'),
                  }
                : undefined
            }
          />
        ) : (
          <SimpleInfiniteList
            items={mobileApprovals}
            renderItem={(approval) => (
              <ApprovalCard
                key={approval.id}
                approval={approval}
                onClick={() => handleMobileCardClick(approval)}
                enableSwipeActions={searchState.tab === 'pending'}
                onSwipeApprove={() => handleSwipeApprove(approval.id)}
                onSwipeReject={() => handleSwipeReject(approval.id)}
              />
            )}
            hasMore={hasNextPage}
            isLoading={isFetchingNextPage}
            onLoadMore={fetchNextPage}
            loadingText="더 불러오는 중..."
            endText="모든 결재 문서를 불러왔습니다."
          />
        )}

        {/* Detail Sheet */}
        <ApprovalDetailSheet
          open={detailSheetOpen}
          onClose={() => setDetailSheetOpen(false)}
          approval={selectedApproval}
          canApprove={searchState.tab === 'pending'}
          onViewDetail={() => {
            if (selectedApproval) {
              navigate(`/approvals/${selectedApproval.id}`);
            }
          }}
        />
      </div>
    );
  }

  // Tablet Layout - Split View
  if (isTablet) {
    const handleTabletCardClick = (approval: ApprovalListItem) => {
      setSelectedApproval(approval);
    };

    return (
      <div className="h-[calc(100vh-8rem)]">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">전자결재</h1>
            <p className="text-sm text-muted-foreground">결재 문서 관리</p>
          </div>
          <Button onClick={() => navigate('/approvals/new')}>
            <Plus className="mr-2 h-4 w-4" />
            새 문서 작성
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setTab('pending')}>
            <CardContent className="pt-4 pb-4">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">결재 대기</p>
                <p className="text-2xl font-bold text-orange-500">{summary.pending}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setTab('draft')}>
            <CardContent className="pt-4 pb-4">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">임시저장</p>
                <p className="text-2xl font-bold text-blue-500">{summary.draft}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setTab('completed')}>
            <CardContent className="pt-4 pb-4">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">승인</p>
                <p className="text-2xl font-bold text-green-500">{summary.approved}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setTab('completed')}>
            <CardContent className="pt-4 pb-4">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">반려</p>
                <p className="text-2xl font-bold text-red-500">{summary.rejected}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Split View */}
        <SplitView
          showRight={!!selectedApproval}
          left={
            <SplitViewPanel
              header={
                <div className="space-y-3">
                  <ApprovalFilterTabs
                    value={searchState.tab as 'pending' | 'requested' | 'completed' | 'draft' | ''}
                    onChange={handleTabChange}
                    counts={{ pending: summary.pending, draft: summary.draft }}
                  />
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="검색..."
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              }
            >
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
                  ))}
                </div>
              ) : approvals.length === 0 ? (
                <EmptyState
                  icon={FileCheck}
                  title="결재 문서가 없습니다"
                  description="결재할 문서가 있으면 여기에 표시됩니다."
                />
              ) : (
                <div className="space-y-2">
                  {approvals.map((approval) => (
                    <div
                      key={approval.id}
                      className={cn(
                        'rounded-lg border p-3 cursor-pointer transition-colors',
                        selectedApproval?.id === approval.id
                          ? 'border-primary bg-primary/5'
                          : 'hover:bg-muted/50'
                      )}
                      onClick={() => handleTabletCardClick(approval)}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="text-xs font-mono text-muted-foreground">
                          {approval.documentNumber}
                        </span>
                        <ApprovalStatusBadge status={approval.status} />
                      </div>
                      <h4 className="font-medium text-sm line-clamp-1">{approval.title}</h4>
                      <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                        <span>{approval.requesterName}</span>
                        <span>{format(new Date(approval.createdAt), 'M/d', { locale: ko })}</span>
                      </div>
                    </div>
                  ))}
                  <Pagination
                    page={searchState.page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                  />
                </div>
              )}
            </SplitViewPanel>
          }
          right={
            selectedApproval ? (
              <SplitViewPanel
                header={
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">문서 상세</h3>
                    <Button size="sm" onClick={() => navigate(`/approvals/${selectedApproval.id}`)}>
                      전체 보기
                    </Button>
                  </div>
                }
              >
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground font-mono">
                      {selectedApproval.documentNumber}
                    </p>
                    <h2 className="text-lg font-semibold mt-1">{selectedApproval.title}</h2>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">유형</p>
                      <p className="text-sm font-medium">{APPROVAL_TYPE_LABELS[selectedApproval.type]}</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">상태</p>
                      <ApprovalStatusBadge status={selectedApproval.status} />
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">기안자</p>
                      <p className="text-sm font-medium">{selectedApproval.requesterName}</p>
                      <p className="text-xs text-muted-foreground">{selectedApproval.requesterDepartment}</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">기안일</p>
                      <p className="text-sm font-medium">
                        {format(new Date(selectedApproval.createdAt), 'yyyy-MM-dd', { locale: ko })}
                      </p>
                    </div>
                  </div>

                  {selectedApproval.currentStepName && (
                    <div className="p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
                      <p className="text-xs text-muted-foreground">현재 결재자</p>
                      <p className="text-sm font-medium text-orange-600 dark:text-orange-400">
                        {selectedApproval.currentStepName}
                      </p>
                    </div>
                  )}

                  {searchState.tab === 'pending' && selectedApproval.status === 'PENDING' && (
                    <div className="flex gap-2 pt-4 border-t">
                      <Button variant="outline" className="flex-1 border-red-200 text-red-600">
                        반려
                      </Button>
                      <Button className="flex-1 bg-green-600 hover:bg-green-700">
                        승인
                      </Button>
                    </div>
                  )}
                </div>
              </SplitViewPanel>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                좌측에서 문서를 선택하세요
              </div>
            )
          }
        />
      </div>
    );
  }

  // Desktop Layout
  return (
    <>
      <PageHeader
        title="전자결재"
        description="결재 문서를 조회하고 관리합니다."
        actions={
          <Button data-tour="approval-create" onClick={() => navigate('/approvals/new')}>
            <Plus className="mr-2 h-4 w-4" />
            새 문서 작성
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">결재 대기</p>
              <p className="mt-1 text-3xl font-bold text-orange-500">{summary.pending}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">임시저장</p>
              <p className="mt-1 text-3xl font-bold text-blue-500">{summary.draft}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">승인</p>
              <p className="mt-1 text-3xl font-bold text-green-500">{summary.approved}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">반려</p>
              <p className="mt-1 text-3xl font-bold text-red-500">{summary.rejected}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>결재 문서</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="문서번호, 제목, 기안자..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9 w-[200px]"
                />
              </div>
              <select
                value={searchState.type}
                onChange={(e) => setType(e.target.value as ApprovalType | '')}
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">전체 유형</option>
                {Object.entries(APPROVAL_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs
            data-tour="approval-filter"
            value={searchState.tab || 'pending'}
            onValueChange={handleTabChange}
            className="px-4 pt-2"
          >
            <TabsList>
              <TabsTrigger value="pending">
                결재 대기 {summary.pending > 0 && `(${summary.pending})`}
              </TabsTrigger>
              <TabsTrigger value="requested">내가 요청한</TabsTrigger>
              <TabsTrigger value="completed">완료</TabsTrigger>
              <TabsTrigger value="draft">
                임시저장 {summary.draft > 0 && `(${summary.draft})`}
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
                icon={FileCheck}
                title="데이터를 불러올 수 없습니다"
                description="잠시 후 다시 시도해주세요."
              />
            ) : approvals.length === 0 ? (
              <EmptyState
                icon={FileCheck}
                title={
                  searchState.tab === 'pending' ? '결재 대기 문서가 없습니다' :
                  searchState.tab === 'requested' ? '요청한 문서가 없습니다' :
                  searchState.tab === 'completed' ? '완료된 문서가 없습니다' :
                  searchState.tab === 'draft' ? '임시저장 문서가 없습니다' :
                  '결재 문서가 없습니다'
                }
                description={
                  searchState.tab === 'requested'
                    ? '새 문서를 작성하여 결재를 요청하세요.'
                    : '결재할 문서가 있으면 여기에 표시됩니다.'
                }
                action={
                  searchState.tab === 'requested'
                    ? {
                        label: '새 문서 작성',
                        onClick: () => navigate('/approvals/new'),
                      }
                    : undefined
                }
              />
            ) : (
              <>
                <div data-tour="approval-list" className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          문서번호
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          유형
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          제목
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          기안자
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          현재 결재자
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          상태
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          기안일
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {approvals.map((approval) => (
                        <tr
                          key={approval.id}
                          onClick={() => handleRowClick(approval.id)}
                          className="border-b cursor-pointer transition-colors hover:bg-muted/50"
                        >
                          <td className="px-4 py-3 font-mono text-sm">
                            {approval.documentNumber}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center gap-2">
                              {APPROVAL_TYPE_LABELS[approval.type]}
                              {approval.urgency === 'HIGH' && (
                                <AlertCircle className="h-4 w-4 text-red-500" />
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium max-w-[300px] truncate">
                            {approval.title}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div>
                              <div>{approval.requesterName}</div>
                              <div className="text-xs text-muted-foreground">
                                {approval.requesterDepartment}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {approval.currentStepName || '-'}
                          </td>
                          <td className="px-4 py-3">
                            <ApprovalStatusBadge status={approval.status} />
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {format(new Date(approval.createdAt), 'M/d', { locale: ko })}
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
