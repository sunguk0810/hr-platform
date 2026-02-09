import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { LeaveStatusBadge, LeaveTypeBadge } from '@/components/common/StatusBadge';
import { SkeletonTable } from '@/components/common/Skeleton';
import { Pagination } from '@/components/common/Pagination';
import { PullToRefreshContainer } from '@/components/mobile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Calendar } from 'lucide-react';
import { useIsMobile } from '@/hooks/useMediaQuery';
import {
  useLeaveBalance,
  useLeaveBalanceByType,
  useLeaveRequests,
  useLeaveSearchParams,
} from '../hooks/useAttendance';
import type { LeaveStatus } from '@hr-platform/shared-types';

export default function MyLeavePage() {
  const { t } = useTranslation('attendance');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const { params, searchState, setStatus, setPage } = useLeaveSearchParams();
  const { data: balanceData, isLoading: isBalanceLoading } = useLeaveBalance();
  const { data: balanceByTypeData } = useLeaveBalanceByType();
  const { data: requestsData, isLoading: isRequestsLoading } = useLeaveRequests(params);

  const balance = balanceData?.data;
  const balanceByType = balanceByTypeData?.data ?? [];
  const requests = requestsData?.data?.content ?? [];
  const totalPages = requestsData?.data?.page?.totalPages ?? 0;

  const handleTabChange = (value: string) => {
    if (value === 'all') {
      setStatus('');
    } else {
      setStatus(value as LeaveStatus);
    }
  };

  const pendingCount = requests.filter(r => r.status === 'PENDING').length;

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['leave-balance'] });
    await queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
  };

  const getEmptyTitle = () => {
    if (!searchState.status) return t('myLeavePage.emptyState.noLeaves');
    if (searchState.status === 'PENDING') return t('myLeavePage.emptyState.noPending');
    if (searchState.status === 'APPROVED') return t('myLeavePage.emptyState.noApproved');
    return t('myLeavePage.emptyState.noRejected');
  };

  // Mobile Layout
  if (isMobile) {
    return (
      <PullToRefreshContainer onRefresh={handleRefresh}>
        <div className="space-y-4 pb-20">
          {/* Mobile Header */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/attendance')}
              className="p-2 -ml-2 rounded-full hover:bg-muted"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold">{t('myLeavePage.title')}</h1>
              <p className="text-sm text-muted-foreground">{t('myLeavePage.mobileDescription')}</p>
            </div>
          </div>

          {/* Leave Balance Summary */}
          {isBalanceLoading ? (
            <div className="bg-card rounded-2xl border p-6">
              <div className="h-20 bg-muted animate-pulse rounded-xl" />
            </div>
          ) : (
            <div className="bg-card rounded-2xl border p-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">{t('myLeavePage.balance.remainingAnnual')}</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-bold text-primary">{balance?.remainingDays ?? 0}</span>
                  <span className="text-xl text-muted-foreground">/ {t('myLeavePage.balance.daysUnit', { count: balance?.totalDays ?? 0 })}</span>
                </div>
                <div className="flex justify-center gap-6 mt-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">{t('myLeavePage.balance.used')}</span>
                    <span className="ml-1 font-medium">{t('myLeavePage.balance.daysUnit', { count: balance?.usedDays ?? 0 })}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('myLeavePage.balance.pending')}</span>
                    <span className="ml-1 font-medium">{t('myLeavePage.balance.daysUnit', { count: balance?.pendingDays ?? 0 })}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Leave Balance by Type (Horizontal Scroll) */}
          {balanceByType.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium px-1">{t('myLeavePage.balanceByType.mobileTitle')}</h3>
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
                {balanceByType.map((item) => (
                  <div
                    key={item.leaveType}
                    className="flex-shrink-0 w-36 bg-card rounded-xl border p-3"
                  >
                    <p className="text-xs font-medium mb-2 truncate">{item.leaveTypeName}</p>
                    <div className="h-1.5 w-full rounded-full bg-muted mb-2">
                      <div
                        className="h-full rounded-full bg-primary transition-[width]"
                        style={{ width: `${item.totalDays > 0 ? ((item.totalDays - item.remainingDays) / item.totalDays) * 100 : 0}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{t('myLeavePage.balance.remaining')}</span>
                      <span className="font-medium text-primary">{t('myLeavePage.balance.daysUnit', { count: item.remainingDays })}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mobile Tab Filters */}
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
            {[
              { value: '', label: t('myLeavePage.tabs.all') },
              { value: 'PENDING', label: pendingCount > 0 ? t('myLeavePage.tabs.pendingWithCount', { count: pendingCount }) : t('myLeavePage.tabs.pending') },
              { value: 'APPROVED', label: t('myLeavePage.tabs.approved') },
              { value: 'REJECTED', label: t('myLeavePage.tabs.rejected') },
            ].map((item) => (
              <button
                key={item.value}
                onClick={() => handleTabChange(item.value)}
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

          {/* Mobile Leave Requests List */}
          {isRequestsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
              ))}
            </div>
          ) : requests.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title={getEmptyTitle()}
              description={t('myLeavePage.emptyState.description')}
            />
          ) : (
            <div className="space-y-3">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="bg-card rounded-xl border p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <LeaveTypeBadge type={request.leaveType} />
                        <LeaveStatusBadge status={request.status} />
                      </div>
                      <p className="text-sm font-medium">
                        {format(new Date(request.startDate), 'M/d (E)', { locale: ko })}
                        {request.startDate !== request.endDate && (
                          <> ~ {format(new Date(request.endDate), 'M/d (E)', { locale: ko })}</>
                        )}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span>{t('myLeavePage.balance.daysUnit', { count: request.days })}</span>
                        <span>·</span>
                        <span className="truncate">{request.reason}</span>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {format(new Date(request.createdAt), 'M/d', { locale: ko })}
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
        title={t('myLeavePage.title')}
        description={t('myLeavePage.description')}
        actions={
          <Button variant="outline" onClick={() => navigate('/attendance')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('myLeavePage.backToAttendance')}
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        {/* Leave Summary Cards */}
        {isBalanceLoading ? (
          [1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="text-center space-y-2">
                  <div className="h-4 bg-muted animate-pulse rounded w-16 mx-auto" />
                  <div className="h-8 bg-muted animate-pulse rounded w-12 mx-auto" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">{t('myLeavePage.balance.totalAnnual')}</p>
                  <p className="mt-1 text-3xl font-bold">{balance?.totalDays ?? 0}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">{t('myLeavePage.balance.used')}</p>
                  <p className="mt-1 text-3xl font-bold">{balance?.usedDays ?? 0}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">{t('myLeavePage.balance.remaining')}</p>
                  <p className="mt-1 text-3xl font-bold text-primary">{balance?.remainingDays ?? 0}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">{t('myLeavePage.balance.pending')}</p>
                  <p className="mt-1 text-3xl font-bold text-muted-foreground">{balance?.pendingDays ?? 0}</p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Leave Balance by Type */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{t('myLeavePage.balanceByType.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            {balanceByType.map((item) => (
              <div key={item.leaveType} className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{item.leaveTypeName}</p>
                  <span className="text-sm text-muted-foreground">
                    {t('myLeavePage.balance.usageInfo', { used: item.usedDays, total: item.totalDays })}
                  </span>
                </div>
                <div className="mt-3 h-2 w-full rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-[width]"
                    style={{ width: `${((item.totalDays - item.remainingDays) / item.totalDays) * 100}%` }}
                  />
                </div>
                <div className="mt-2 flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('myLeavePage.balance.remaining')}</span>
                  <span className="font-medium text-primary">{t('myLeavePage.balance.daysUnit', { count: item.remainingDays })}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Leave History */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{t('myLeavePage.history.title')}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs
            value={searchState.status || 'all'}
            onValueChange={handleTabChange}
            className="px-4 pt-2"
          >
            <TabsList>
              <TabsTrigger value="all">{t('myLeavePage.tabs.all')}</TabsTrigger>
              <TabsTrigger value="PENDING">
                {t('myLeavePage.tabs.pending')} {pendingCount > 0 && `(${pendingCount})`}
              </TabsTrigger>
              <TabsTrigger value="APPROVED">{t('myLeavePage.tabs.approved')}</TabsTrigger>
              <TabsTrigger value="REJECTED">{t('myLeavePage.tabs.rejected')}</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="mt-4">
            {isRequestsLoading ? (
              <div className="p-4">
                <SkeletonTable rows={5} />
              </div>
            ) : requests.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title={getEmptyTitle()}
                description={t('myLeavePage.emptyState.description')}
              />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          {t('myLeavePage.table.type')}
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          {t('myLeavePage.table.period')}
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          {t('myLeavePage.table.days')}
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          {t('myLeavePage.table.reason')}
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          {t('myLeavePage.table.status')}
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          {t('myLeavePage.table.requestDate')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {requests.map((request) => (
                        <tr
                          key={request.id}
                          className="border-b transition-colors hover:bg-muted/50"
                        >
                          <td className="px-4 py-3">
                            <LeaveTypeBadge type={request.leaveType} />
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {format(new Date(request.startDate), 'M/d (E)', { locale: ko })}
                            {request.startDate !== request.endDate && (
                              <> ~ {format(new Date(request.endDate), 'M/d (E)', { locale: ko })}</>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm">{t('myLeavePage.balance.daysUnit', { count: request.days })}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground max-w-[200px] truncate">
                            {request.reason}
                          </td>
                          <td className="px-4 py-3">
                            <LeaveStatusBadge status={request.status} />
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {format(new Date(request.createdAt), 'M/d', { locale: ko })}
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
