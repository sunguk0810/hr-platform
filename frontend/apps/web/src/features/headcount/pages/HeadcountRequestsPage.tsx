import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
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
import { FileText, Plus, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useHeadcountRequests,
  useHeadcountRequestSearchParams,
} from '../hooks/useHeadcount';
import type { HeadcountRequestStatus, HeadcountRequestType } from '@hr-platform/shared-types';
import {
  HEADCOUNT_REQUEST_STATUS_LABELS,
  HEADCOUNT_REQUEST_TYPE_LABELS,
} from '@hr-platform/shared-types';

const STATUS_COLORS: Record<HeadcountRequestStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  CANCELLED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

const TYPE_ICONS: Record<HeadcountRequestType, React.ReactNode> = {
  INCREASE: <TrendingUp className="h-4 w-4 text-green-600" aria-hidden="true" />,
  DECREASE: <TrendingDown className="h-4 w-4 text-red-600" aria-hidden="true" />,
  TRANSFER: <RefreshCw className="h-4 w-4 text-blue-600" aria-hidden="true" />,
};

export default function HeadcountRequestsPage() {
  const navigate = useNavigate();

  const {
    params,
    searchState,
    setType,
    setStatus,
    setPage,
    resetFilters,
  } = useHeadcountRequestSearchParams();

  const { data: requestsData, isLoading } = useHeadcountRequests(params);

  const requests = requestsData?.data?.content ?? [];
  const totalPages = requestsData?.data?.totalPages ?? 0;

  const handleTabChange = (value: string) => {
    if (value === 'all') {
      setStatus('');
    } else {
      setStatus(value as HeadcountRequestStatus);
    }
  };

  return (
    <>
      <PageHeader
        title="정현원 변경 요청"
        description="증원, 감원, 전환 요청을 관리합니다."
        actions={
          <Button onClick={() => navigate('/headcount/requests/new')}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            변경 요청
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" aria-hidden="true" />
              변경 요청 목록
            </CardTitle>
            <Select
              value={searchState.type || 'all'}
              onValueChange={(value) => setType(value === 'all' ? '' : value as HeadcountRequestType)}
            >
              <SelectTrigger className="w-[120px]" aria-label="요청 유형 필터">
                <SelectValue placeholder="유형" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 유형</SelectItem>
                {Object.entries(HEADCOUNT_REQUEST_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              <TabsTrigger value="PENDING">대기중</TabsTrigger>
              <TabsTrigger value="APPROVED">승인</TabsTrigger>
              <TabsTrigger value="REJECTED">반려</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="mt-4">
            {isLoading ? (
              <div className="p-4">
                <SkeletonTable rows={5} />
              </div>
            ) : requests.length === 0 ? (
              <EmptyState
                icon={FileText}
                title={
                  searchState.status || searchState.type
                    ? '검색 결과가 없습니다'
                    : '변경 요청이 없습니다'
                }
                description={
                  searchState.status || searchState.type
                    ? '다른 필터를 선택해 보세요.'
                    : '정현원 변경 요청을 등록하세요.'
                }
                action={
                  searchState.status || searchState.type
                    ? { label: '필터 초기화', onClick: resetFilters }
                    : { label: '변경 요청', onClick: () => navigate('/headcount/requests/new') }
                }
              />
            ) : (
              <>
                <div className="overflow-x-auto" role="region" aria-label="정현원 변경 요청 목록">
                  <table className="w-full" role="grid" aria-label="변경 요청">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-muted-foreground w-[130px]">
                          요청번호
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-muted-foreground w-[100px]">
                          유형
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          부서
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          직급
                        </th>
                        <th scope="col" className="px-4 py-3 text-right text-sm font-medium text-muted-foreground w-[80px]">
                          현재
                        </th>
                        <th scope="col" className="px-4 py-3 text-right text-sm font-medium text-muted-foreground w-[80px]">
                          요청
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-muted-foreground w-[100px]">
                          요청자
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-muted-foreground w-[100px]">
                          적용일
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-muted-foreground w-[100px]">
                          상태
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {requests.map((request) => (
                        <tr
                          key={request.id}
                          className="border-b cursor-pointer transition-colors hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                          onClick={() => navigate(`/headcount/requests/${request.id}`)}
                          onKeyDown={(e) => e.key === 'Enter' && navigate(`/headcount/requests/${request.id}`)}
                          tabIndex={0}
                          role="row"
                          aria-label={`${request.requestNumber}: ${request.departmentName} ${HEADCOUNT_REQUEST_TYPE_LABELS[request.type]}`}
                        >
                          <td className="px-4 py-3 font-mono text-sm">
                            {request.requestNumber}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              {TYPE_ICONS[request.type]}
                              <span className="text-sm">{HEADCOUNT_REQUEST_TYPE_LABELS[request.type]}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {request.departmentName}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {request.gradeName}
                          </td>
                          <td className="px-4 py-3 text-sm text-right">
                            {request.currentCount}
                          </td>
                          <td className={cn(
                            'px-4 py-3 text-sm text-right font-medium',
                            request.requestedCount > request.currentCount && 'text-green-600',
                            request.requestedCount < request.currentCount && 'text-red-600'
                          )}>
                            {request.requestedCount}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {request.requesterName}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {format(new Date(request.effectiveDate), 'yyyy-MM-dd', { locale: ko })}
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={cn(STATUS_COLORS[request.status])} role="status">
                              {HEADCOUNT_REQUEST_STATUS_LABELS[request.status]}
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
