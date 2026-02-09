import { useState } from 'react';
import { format, subDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
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

const FIELD_KEYS: Record<PrivacyField, string> = {
  residentNumber: 'privacyAccessLog.fieldLabels.residentNumber',
  bankAccount: 'privacyAccessLog.fieldLabels.bankAccount',
  address: 'privacyAccessLog.fieldLabels.address',
  mobile: 'privacyAccessLog.fieldLabels.mobile',
  email: 'privacyAccessLog.fieldLabels.email',
  birthDate: 'privacyAccessLog.fieldLabels.birthDate',
  phone: 'privacyAccessLog.fieldLabels.phone',
};

const STATUS_KEYS: Record<PrivacyAccessStatus, string> = {
  PENDING: 'privacyAccessLog.statusOptions.PENDING',
  APPROVED: 'privacyAccessLog.statusOptions.APPROVED',
  REJECTED: 'privacyAccessLog.statusOptions.REJECTED',
  EXPIRED: 'privacyAccessLog.statusOptions.EXPIRED',
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
  const { t } = useTranslation('employee');
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
        title: t('toast.approveComplete'),
        description: t('privacyAccessLog.approveSuccess'),
      });
    } catch {
      toast({
        title: t('toast.approveFailure'),
        description: t('privacyAccessLog.approveFailure'),
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
          rejectionReason: t('privacyAccessLog.rejectDefaultReason'),
        },
      });
      toast({
        title: t('toast.rejectComplete'),
        description: t('privacyAccessLog.rejectSuccess'),
      });
      setRejectingRequestId(null);
    } catch {
      toast({
        title: t('toast.rejectFailure'),
        description: t('privacyAccessLog.rejectFailure'),
        variant: 'destructive',
      });
    }
  };

  const renderStatusBadge = (status: PrivacyAccessStatus) => {
    const Icon = STATUS_ICONS[status];
    return (
      <Badge className={cn('gap-1', STATUS_COLORS[status])}>
        <Icon className="h-3 w-3" />
        {t(STATUS_KEYS[status])}
      </Badge>
    );
  };

  return (
    <>
      <PageHeader
        title={t('privacyAccessLog.pageTitle')}
        description={t('privacyAccessLog.pageDescription')}
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
              {t('common.refresh')}
            </Button>
            <Button
              variant={showFilters ? 'secondary' : 'outline'}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="mr-2 h-4 w-4" />
              {t('common.filter')}
            </Button>
          </div>
        }
      />

      {/* Filters */}
      {showFilters && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">{t('privacyAccessLog.searchFilter')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {activeTab === 'logs' && (
                <div className="space-y-2">
                  <Label>{t('privacyAccessLog.fieldType')}</Label>
                  <Select
                    value={logSearchState.field || 'all'}
                    onValueChange={(value) => setField(value === 'all' ? '' : (value as PrivacyField))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('common.all')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('common.all')}</SelectItem>
                      {(Object.keys(FIELD_KEYS) as PrivacyField[]).map((value) => (
                        <SelectItem key={value} value={value}>
                          {t(FIELD_KEYS[value])}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {activeTab === 'requests' && (
                <div className="space-y-2">
                  <Label>{t('privacyAccessLog.statusLabel')}</Label>
                  <Select
                    value={requestSearchState.status || 'all'}
                    onValueChange={(value) =>
                      setStatus(value === 'all' ? '' : (value as PrivacyAccessStatus))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('common.all')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('common.all')}</SelectItem>
                      {(Object.keys(STATUS_KEYS) as PrivacyAccessStatus[]).map((value) => (
                        <SelectItem key={value} value={value}>
                          {t(STATUS_KEYS[value])}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>{t('privacyAccessLog.startDate')}</Label>
                <DatePicker
                  value={startDate}
                  onChange={setStartDate}
                  placeholder={t('privacyAccessLog.startDatePlaceholder')}
                />
              </div>

              <div className="space-y-2">
                <Label>{t('privacyAccessLog.endDate')}</Label>
                <DatePicker
                  value={endDate}
                  onChange={setEndDate}
                  placeholder={t('privacyAccessLog.endDatePlaceholder')}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={handleResetFilters}>
                {t('common.reset')}
              </Button>
              <Button onClick={handleApplyDateFilter}>{t('common.apply')}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'logs' | 'requests')}>
        <TabsList>
          <TabsTrigger value="logs">
            <Eye className="mr-2 h-4 w-4" />
            {t('privacyAccessLog.logsTab')}
          </TabsTrigger>
          <TabsTrigger value="requests">
            <Shield className="mr-2 h-4 w-4" />
            {t('privacyAccessLog.requestsTab')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                {t('privacyAccessLog.logsTitle')}
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
                  title={t('privacyAccessLog.emptyLogs')}
                  description={t('privacyAccessLog.emptyLogsDescription')}
                />
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('privacyAccessLog.tableAccessDate')}</TableHead>
                        <TableHead>{t('privacyAccessLog.tableAccessor')}</TableHead>
                        <TableHead>{t('privacyAccessLog.tableTargetEmployee')}</TableHead>
                        <TableHead>{t('privacyAccessLog.tableField')}</TableHead>
                        <TableHead>{t('privacyAccessLog.tablePurpose')}</TableHead>
                        <TableHead>{t('privacyAccessLog.tableApprovalStatus')}</TableHead>
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
                            <Badge variant="outline">{t(FIELD_KEYS[log.field])}</Badge>
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
                {t('privacyAccessLog.requestsTitle')}
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
                  title={t('privacyAccessLog.emptyRequests')}
                  description={t('privacyAccessLog.emptyRequestsDescription')}
                />
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('privacyAccessLog.tableRequestDate')}</TableHead>
                        <TableHead>{t('privacyAccessLog.tableRequester')}</TableHead>
                        <TableHead>{t('privacyAccessLog.tableTargetEmployee')}</TableHead>
                        <TableHead>{t('privacyAccessLog.tableRequestField')}</TableHead>
                        <TableHead>{t('privacyAccessLog.tableRequestPurpose')}</TableHead>
                        <TableHead>{t('privacyAccessLog.statusLabel')}</TableHead>
                        <TableHead className="w-[100px]">{t('privacyAccessLog.tableAction')}</TableHead>
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
                                  {t(FIELD_KEYS[field])}
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
        title={t('privacyAccessLog.rejectTitle')}
        description={t('privacyAccessLog.rejectDescription')}
        confirmLabel={t('privacyAccessLog.rejectLabel')}
        variant="destructive"
        onConfirm={handleReject}
        isLoading={approveMutation.isPending}
      />
    </>
  );
}
