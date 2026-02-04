import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { SkeletonTable } from '@/components/common/Skeleton';
import { Pagination } from '@/components/common/Pagination';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeftRight,
  Plus,
  Search,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react';
import {
  useTransfers,
  useTransferSummary,
  useTransferSearchParams,
} from '../hooks/useTransfer';
import type { TransferStatus, TransferType } from '@hr-platform/shared-types';
import { TRANSFER_STATUS_LABELS, TRANSFER_TYPE_LABELS } from '@hr-platform/shared-types';
import { cn } from '@/lib/utils';

const STATUS_COLORS: Record<TransferStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  PENDING_SOURCE: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  PENDING_TARGET: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  APPROVED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  CANCELLED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

const TYPE_ICONS: Record<TransferType, React.ReactNode> = {
  TRANSFER_OUT: <ArrowRight className="h-4 w-4" aria-hidden="true" />,
  TRANSFER_IN: <ArrowLeft className="h-4 w-4" aria-hidden="true" />,
  SECONDMENT: <RefreshCw className="h-4 w-4" aria-hidden="true" />,
};

export default function TransferListPage() {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');

  const {
    params,
    searchState,
    setKeyword,
    setType,
    setStatus,
    setPage,
    resetFilters,
  } = useTransferSearchParams();

  const { data: transfersData, isLoading } = useTransfers(params);
  const { data: summaryData, isLoading: isSummaryLoading } = useTransferSummary();

  const transfers = transfersData?.data?.content ?? [];
  const totalPages = transfersData?.data?.totalPages ?? 0;
  const summary = summaryData?.data;

  const handleSearch = () => {
    setKeyword(searchInput);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleRowClick = (id: string) => {
    navigate(`/transfer/${id}`);
  };

  const handleTabChange = (value: string) => {
    if (value === 'all') {
      setStatus('');
    } else {
      setStatus(value as TransferStatus);
    }
  };

  return (
    <>
      <PageHeader
        title="계열사 인사이동"
        description="전출/전입 및 파견 현황을 관리합니다."
        actions={
          <Button onClick={() => navigate('/transfer/new')}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            인사이동 요청
          </Button>
        }
      />

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6" role="region" aria-label="인사이동 현황 요약">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground" id="pending-source-label">전출 승인대기</p>
              <p className="mt-1 text-3xl font-bold text-orange-500" aria-labelledby="pending-source-label">
                {isSummaryLoading ? '-' : summary?.pendingSourceCount ?? 0}
                <span className="sr-only">건</span>
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground" id="pending-target-label">전입 승인대기</p>
              <p className="mt-1 text-3xl font-bold text-yellow-500" aria-labelledby="pending-target-label">
                {isSummaryLoading ? '-' : summary?.pendingTargetCount ?? 0}
                <span className="sr-only">건</span>
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground" id="approved-label">승인완료</p>
              <p className="mt-1 text-3xl font-bold text-blue-500" aria-labelledby="approved-label">
                {isSummaryLoading ? '-' : summary?.approvedCount ?? 0}
                <span className="sr-only">건</span>
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground" id="completed-label">이번달 완료</p>
              <p className="mt-1 text-3xl font-bold text-green-500" aria-labelledby="completed-label">
                {isSummaryLoading ? '-' : summary?.completedThisMonth ?? 0}
                <span className="sr-only">건</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5" aria-hidden="true" />
              인사이동 목록
            </CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input
                  placeholder="이름, 사번 검색..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pl-9 w-[200px]"
                  aria-label="인사이동 검색"
                />
              </div>
              <Select
                value={searchState.type || 'all'}
                onValueChange={(value) => setType(value === 'all' ? '' : (value as TransferType))}
              >
                <SelectTrigger className="w-[120px]" aria-label="이동 유형 필터">
                  <SelectValue placeholder="전체 유형" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 유형</SelectItem>
                  {Object.entries(TRANSFER_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
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
              <TabsTrigger value="DRAFT">임시저장</TabsTrigger>
              <TabsTrigger value="PENDING_SOURCE">전출 대기</TabsTrigger>
              <TabsTrigger value="PENDING_TARGET">전입 대기</TabsTrigger>
              <TabsTrigger value="APPROVED">승인</TabsTrigger>
              <TabsTrigger value="COMPLETED">완료</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="mt-4">
            {isLoading ? (
              <div className="p-4">
                <SkeletonTable rows={5} />
              </div>
            ) : transfers.length === 0 ? (
              <EmptyState
                icon={ArrowLeftRight}
                title={
                  searchState.status || searchState.keyword || searchState.type
                    ? '검색 결과가 없습니다'
                    : '인사이동 요청이 없습니다'
                }
                description={
                  searchState.status || searchState.keyword || searchState.type
                    ? '다른 검색 조건을 시도해 보세요.'
                    : '새 인사이동 요청을 등록하세요.'
                }
                action={
                  searchState.status || searchState.keyword || searchState.type
                    ? { label: '필터 초기화', onClick: resetFilters }
                    : { label: '인사이동 요청', onClick: () => navigate('/transfer/new') }
                }
              />
            ) : (
              <>
                <div className="overflow-x-auto" role="region" aria-label="인사이동 목록">
                  <table className="w-full" role="grid" aria-label="인사이동">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-muted-foreground w-[130px]">
                          요청번호
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-muted-foreground w-[80px]">
                          유형
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          대상자
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          전출 테넌트
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          전입 테넌트
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-muted-foreground w-[100px]">
                          발령일
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-muted-foreground w-[100px]">
                          상태
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {transfers.map((transfer) => (
                        <tr
                          key={transfer.id}
                          className="border-b cursor-pointer transition-colors hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                          onClick={() => handleRowClick(transfer.id)}
                          onKeyDown={(e) => e.key === 'Enter' && handleRowClick(transfer.id)}
                          tabIndex={0}
                          role="row"
                          aria-label={`${transfer.requestNumber}: ${transfer.employeeName} ${TRANSFER_TYPE_LABELS[transfer.type]}`}
                        >
                          <td className="px-4 py-3 font-mono text-sm">
                            {transfer.requestNumber}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              {TYPE_ICONS[transfer.type]}
                              <span className="text-sm">{TRANSFER_TYPE_LABELS[transfer.type]}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div>
                              <p className="font-medium">{transfer.employeeName}</p>
                              <p className="text-xs text-muted-foreground">{transfer.employeeNumber}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {transfer.sourceTenantName}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {transfer.targetTenantName}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {format(new Date(transfer.effectiveDate), 'yyyy-MM-dd', { locale: ko })}
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={cn(STATUS_COLORS[transfer.status])} role="status">
                              {TRANSFER_STATUS_LABELS[transfer.status]}
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
