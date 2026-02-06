import { useState } from 'react';
import { format, subDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { Pagination } from '@/components/common/Pagination';
import { DatePicker } from '@/components/common/DatePicker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Shield,
  Filter,
  RefreshCw,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import {
  usePrivacyAccessLogs,
  usePrivacyAccessRequests,
  usePrivacyAccessLogSearchParams,
  usePrivacyAccessRequestSearchParams,
  useApprovePrivacyAccessRequest,
} from '../hooks/useEmployees';
import { useToast } from '@/hooks/useToast';
import type { PrivacyField, PrivacyAccessStatus } from '@hr-platform/shared-types';
import { cn } from '@/lib/utils';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';

const FIELD_LABELS: Record<PrivacyField, string> = {
  residentNumber: '주민등록번호',
  bankAccount: '계좌번호',
  address: '주소',
  mobile: '휴대전화',
  email: '이메일',
  birthDate: '생년월일',
  phone: '전화번호',
};

const STATUS_LABELS: Record<PrivacyAccessStatus, string> = {
  PENDING: '대기중',
  APPROVED: '승인됨',
  REJECTED: '반려됨',
  EXPIRED: '만료됨',
};

const STATUS_COLORS: Record<PrivacyAccessStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  EXPIRED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

const STATUS_ICONS: Record<PrivacyAccessStatus, React.ElementType> = {
  PENDING: Clock,
  APPROVED: CheckCircle,
  REJECTED: XCircle,
  EXPIRED: AlertCircle,
};

export default function PrivacyAccessLogPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'logs' | 'requests'>('logs');
  const [showFilters, setShowFilters] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [rejectingRequestId, setRejectingRequestId] = useState<string | null>(null);

  const {
    params: logParams,
    searchState: logSearchState,
    setField,
    setDateRange,
    setPage: setLogPage,
    resetFilters: resetLogFilters,
  } = usePrivacyAccessLogSearchParams();

  const {
    params: requestParams,
    searchState: requestSearchState,
    setStatus,
    setPage: setRequestPage,
    resetFilters: resetRequestFilters,
  } = usePrivacyAccessRequestSearchParams();

  const {
    data: logsData,
    isLoading: logsLoading,
    refetch: refetchLogs,
  } = usePrivacyAccessLogs({
    ...logParams,
    startDate: startDate ? format(startDate, 'yyyy-MM-dd') : undefined,
    endDate: endDate ? format(endDate, 'yyyy-MM-dd') : undefined,
  });

  const {
    data: requestsData,
    isLoading: requestsLoading,
    refetch: refetchRequests,
  } = usePrivacyAccessRequests(requestParams);

  const approveMutation = useApprovePrivacyAccessRequest();

  const logs = logsData?.data?.content ?? [];
  const logTotalPages = logsData?.data?.page?.totalPages ?? 0;
  const requests = requestsData?.data?.content ?? [];
  const requestTotalPages = requestsData?.data?.page?.totalPages ?? 0;

  const handleApplyDateFilter = () => {
    setDateRange(
      startDate ? format(startDate, 'yyyy-MM-dd') : '',
      endDate ? format(endDate, 'yyyy-MM-dd') : ''
    );
  };

  const handleResetFilters = () => {
    setStartDate(subDays(new Date(), 30));
    setEndDate(new Date());
    if (activeTab === 'logs') {
      resetLogFilters();
    } else {
      resetRequestFilters();
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      await approveMutation.mutateAsync({
        requestId,
        data: { approved: true },
      });
      toast({
        title: '승인 완료',
        description: '개인정보 열람 요청이 승인되었습니다.',
      });
    } catch {
      toast({
        title: '승인 실패',
        description: '요청 승인 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleReject = async () => {
    if (!rejectingRequestId) return;

    try {
      await approveMutation.mutateAsync({
        requestId: rejectingRequestId,
        data: {
          approved: false,
          rejectionReason: '요청 사유가 부적절합니다.',
        },
      });
      toast({
        title: '반려 완료',
        description: '개인정보 열람 요청이 반려되었습니다.',
      });
      setRejectingRequestId(null);
    } catch {
      toast({
        title: '반려 실패',
        description: '요청 반려 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  const renderStatusBadge = (status: PrivacyAccessStatus) => {
    const Icon = STATUS_ICONS[status];
    return (
      <Badge className={cn('gap-1', STATUS_COLORS[status])}>
        <Icon className="h-3 w-3" />
        {STATUS_LABELS[status]}
      </Badge>
    );
  };

  return (
    <>
      <PageHeader
        title="개인정보 열람 이력"
        description="개인정보 열람 요청 및 이력을 관리합니다."
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                if (activeTab === 'logs') refetchLogs();
                else refetchRequests();
              }}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              새로고침
            </Button>
            <Button
              variant={showFilters ? 'secondary' : 'outline'}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="mr-2 h-4 w-4" />
              필터
            </Button>
          </div>
        }
      />

      {/* Filters */}
      {showFilters && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">검색 필터</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {activeTab === 'logs' && (
                <div className="space-y-2">
                  <Label>필드 유형</Label>
                  <Select
                    value={logSearchState.field || 'all'}
                    onValueChange={(value) => setField(value === 'all' ? '' : (value as PrivacyField))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="전체" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      {Object.entries(FIELD_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {activeTab === 'requests' && (
                <div className="space-y-2">
                  <Label>상태</Label>
                  <Select
                    value={requestSearchState.status || 'all'}
                    onValueChange={(value) =>
                      setStatus(value === 'all' ? '' : (value as PrivacyAccessStatus))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="전체" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      {Object.entries(STATUS_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>시작일</Label>
                <DatePicker
                  value={startDate}
                  onChange={setStartDate}
                  placeholder="시작일 선택"
                />
              </div>

              <div className="space-y-2">
                <Label>종료일</Label>
                <DatePicker
                  value={endDate}
                  onChange={setEndDate}
                  placeholder="종료일 선택"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={handleResetFilters}>
                초기화
              </Button>
              <Button onClick={handleApplyDateFilter}>적용</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'logs' | 'requests')}>
        <TabsList>
          <TabsTrigger value="logs">
            <Eye className="mr-2 h-4 w-4" />
            열람 이력
          </TabsTrigger>
          <TabsTrigger value="requests">
            <Shield className="mr-2 h-4 w-4" />
            열람 요청
          </TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                개인정보 열람 이력
              </CardTitle>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : logs.length === 0 ? (
                <EmptyState
                  icon={Eye}
                  title="열람 이력 없음"
                  description="선택한 기간 내 개인정보 열람 이력이 없습니다."
                />
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>열람일시</TableHead>
                        <TableHead>열람자</TableHead>
                        <TableHead>대상 직원</TableHead>
                        <TableHead>열람 필드</TableHead>
                        <TableHead>열람 목적</TableHead>
                        <TableHead>승인 상태</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            {format(new Date(log.accessedAt), 'yyyy.MM.dd HH:mm', { locale: ko })}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{log.accessorName}</p>
                              {log.accessorDepartment && (
                                <p className="text-xs text-muted-foreground">
                                  {log.accessorDepartment}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{log.targetEmployeeName}</p>
                              <p className="text-xs text-muted-foreground">
                                {log.targetEmployeeNumber}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{FIELD_LABELS[log.field]}</Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">{log.purpose}</TableCell>
                          <TableCell>
                            {log.approvalStatus ? renderStatusBadge(log.approvalStatus) : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {logTotalPages > 1 && (
                    <div className="mt-4">
                      <Pagination
                        page={logSearchState.page}
                        totalPages={logTotalPages}
                        onPageChange={setLogPage}
                      />
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                개인정보 열람 요청
              </CardTitle>
            </CardHeader>
            <CardContent>
              {requestsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : requests.length === 0 ? (
                <EmptyState
                  icon={Shield}
                  title="열람 요청 없음"
                  description="개인정보 열람 요청이 없습니다."
                />
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>요청일시</TableHead>
                        <TableHead>요청자</TableHead>
                        <TableHead>대상 직원</TableHead>
                        <TableHead>요청 필드</TableHead>
                        <TableHead>요청 목적</TableHead>
                        <TableHead>상태</TableHead>
                        <TableHead className="w-[100px]">처리</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {requests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell>
                            {format(new Date(request.createdAt), 'yyyy.MM.dd HH:mm', { locale: ko })}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{request.requesterName}</p>
                              {request.requesterDepartment && (
                                <p className="text-xs text-muted-foreground">
                                  {request.requesterDepartment}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{request.targetEmployeeName}</p>
                              <p className="text-xs text-muted-foreground">
                                {request.targetEmployeeNumber}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {request.fields.map((field) => (
                                <Badge key={field} variant="outline" className="text-xs">
                                  {FIELD_LABELS[field]}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">{request.purpose}</TableCell>
                          <TableCell>{renderStatusBadge(request.status)}</TableCell>
                          <TableCell>
                            {request.status === 'PENDING' && (
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2 text-green-600"
                                  onClick={() => handleApprove(request.id)}
                                  disabled={approveMutation.isPending}
                                >
                                  <CheckCircle className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2 text-red-600"
                                  onClick={() => setRejectingRequestId(request.id)}
                                  disabled={approveMutation.isPending}
                                >
                                  <XCircle className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {requestTotalPages > 1 && (
                    <div className="mt-4">
                      <Pagination
                        page={requestSearchState.page}
                        totalPages={requestTotalPages}
                        onPageChange={setRequestPage}
                      />
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Reject Confirmation Dialog */}
      <ConfirmDialog
        open={!!rejectingRequestId}
        onOpenChange={(open) => !open && setRejectingRequestId(null)}
        title="열람 요청 반려"
        description="해당 개인정보 열람 요청을 반려하시겠습니까?"
        confirmLabel="반려"
        variant="destructive"
        onConfirm={handleReject}
        isLoading={approveMutation.isPending}
      />
    </>
  );
}
