import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { LeaveStatusBadge, LeaveTypeBadge } from '@/components/common/StatusBadge';
import { SkeletonTable } from '@/components/common/Skeleton';
import { Pagination } from '@/components/common/Pagination';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Calendar } from 'lucide-react';
import {
  useLeaveBalance,
  useLeaveBalanceByType,
  useLeaveRequests,
  useLeaveSearchParams,
} from '../hooks/useAttendance';
import type { LeaveStatus } from '@hr-platform/shared-types';

export default function MyLeavePage() {
  const navigate = useNavigate();
  const { params, searchState, setStatus, setPage } = useLeaveSearchParams();
  const { data: balanceData, isLoading: isBalanceLoading } = useLeaveBalance();
  const { data: balanceByTypeData } = useLeaveBalanceByType();
  const { data: requestsData, isLoading: isRequestsLoading } = useLeaveRequests(params);

  const balance = balanceData?.data;
  const balanceByType = balanceByTypeData?.data ?? [];
  const requests = requestsData?.data?.content ?? [];
  const totalPages = requestsData?.data?.totalPages ?? 0;

  const handleTabChange = (value: string) => {
    if (value === 'all') {
      setStatus('');
    } else {
      setStatus(value as LeaveStatus);
    }
  };

  const pendingCount = requests.filter(r => r.status === 'PENDING').length;

  return (
    <>
      <PageHeader
        title="내 휴가"
        description="휴가 현황 및 사용 내역을 확인합니다."
        actions={
          <Button variant="outline" onClick={() => navigate('/attendance')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            근태관리
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
                  <p className="text-sm text-muted-foreground">총 연차</p>
                  <p className="mt-1 text-3xl font-bold">{balance?.totalDays ?? 0}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">사용</p>
                  <p className="mt-1 text-3xl font-bold">{balance?.usedDays ?? 0}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">잔여</p>
                  <p className="mt-1 text-3xl font-bold text-primary">{balance?.remainingDays ?? 0}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">예정</p>
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
          <CardTitle>휴가 유형별 현황</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            {balanceByType.map((item) => (
              <div key={item.leaveType} className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{item.leaveTypeName}</p>
                  <span className="text-sm text-muted-foreground">
                    {item.usedDays} / {item.totalDays}일 사용
                  </span>
                </div>
                <div className="mt-3 h-2 w-full rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${((item.totalDays - item.remainingDays) / item.totalDays) * 100}%` }}
                  />
                </div>
                <div className="mt-2 flex justify-between text-sm">
                  <span className="text-muted-foreground">잔여</span>
                  <span className="font-medium text-primary">{item.remainingDays}일</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Leave History */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>휴가 내역</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs
            value={searchState.status || 'all'}
            onValueChange={handleTabChange}
            className="px-4 pt-2"
          >
            <TabsList>
              <TabsTrigger value="all">전체</TabsTrigger>
              <TabsTrigger value="PENDING">
                대기중 {pendingCount > 0 && `(${pendingCount})`}
              </TabsTrigger>
              <TabsTrigger value="APPROVED">승인</TabsTrigger>
              <TabsTrigger value="REJECTED">반려</TabsTrigger>
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
                title={
                  searchState.status
                    ? `${searchState.status === 'PENDING' ? '대기중인' : searchState.status === 'APPROVED' ? '승인된' : '반려된'} 휴가가 없습니다`
                    : '휴가 내역이 없습니다'
                }
                description="휴가 사용 내역이 여기에 표시됩니다."
              />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          유형
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          기간
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          일수
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          사유
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          상태
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          신청일
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
                          <td className="px-4 py-3 text-sm">{request.days}일</td>
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
