import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useQueryClient } from '@tanstack/react-query';
import {
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Users,
  Clock,
  Download,
  RotateCcw,
  Filter,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { SkeletonTable, SkeletonCard } from '@/components/common/Skeleton';
import { PullToRefreshContainer } from '@/components/mobile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  useWorkHoursStatistics,
  useWorkHoursSearchParams,
} from '../hooks/useAttendance';
import { useIsMobile } from '@/hooks/useMediaQuery';
import type { WorkHourStatus, EmployeeWorkHours } from '@hr-platform/shared-types';

// Mock department data (department/person names are kept in Korean as mock data)
const DEPARTMENTS = [
  { id: 'all', name: '전체 부서' },
  { id: 'dept-001', name: '개발팀' },
  { id: 'dept-002', name: '인사팀' },
  { id: 'dept-003', name: '마케팅팀' },
  { id: 'dept-004', name: '영업팀' },
  { id: 'dept-005', name: '재무팀' },
];

function WorkHourStatusBadge({ status }: { status: WorkHourStatus }) {
  const { t } = useTranslation('attendance');

  const STATUS_CONFIG: Record<WorkHourStatus, { label: string; color: string; bgColor: string }> = {
    NORMAL: { label: t('workHourMonitoringPage.statusLabels.NORMAL'), color: 'text-green-700', bgColor: 'bg-green-100' },
    WARNING: { label: t('workHourMonitoringPage.statusLabels.WARNING'), color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
    EXCEEDED: { label: t('workHourMonitoringPage.statusLabels.EXCEEDED'), color: 'text-red-700', bgColor: 'bg-red-100' },
  };

  const config = STATUS_CONFIG[status];
  return (
    <Badge variant="outline" className={`${config.bgColor} ${config.color} border-0`}>
      {config.label}
    </Badge>
  );
}

function WorkHourProgressBar({ employee }: { employee: EmployeeWorkHours }) {
  const maxHours = 52;
  const percentage = Math.min((employee.totalHours / maxHours) * 100, 100);

  let progressColor = 'bg-green-500';
  if (employee.status === 'WARNING') {
    progressColor = 'bg-yellow-500';
  } else if (employee.status === 'EXCEEDED') {
    progressColor = 'bg-red-500';
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <Progress
          value={percentage}
          className="h-2"
          style={{
            ['--progress-color' as string]: progressColor,
          }}
        />
      </div>
      <span className="w-16 text-right text-sm font-medium tabular-nums">
        {employee.totalHours}h / 52h
      </span>
    </div>
  );
}

export default function WorkHourMonitoringPage() {
  const { t } = useTranslation('attendance');
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const [showFilters, setShowFilters] = useState(false);

  const {
    params,
    searchState,
    isCurrentWeek,
    goToPreviousWeek,
    goToNextWeek,
    goToCurrentWeek,
    setDepartmentId,
    setStatus,
    resetFilters,
  } = useWorkHoursSearchParams();

  const { data, isLoading } = useWorkHoursStatistics(params);

  const statistics = data?.data;
  const employees = statistics?.employees ?? [];
  const summary = statistics?.summary;

  const exceededEmployees = employees.filter(e => e.status === 'EXCEEDED');

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['workHoursStatistics'] });
  };

  const handleExport = () => {
    // CSV export logic would go here
    const csvContent = [
      [
        t('workHourMonitoringPage.csvHeaders.employeeName'),
        t('workHourMonitoringPage.csvHeaders.department'),
        t('workHourMonitoringPage.csvHeaders.regularHours'),
        t('workHourMonitoringPage.csvHeaders.overtimeHours'),
        t('workHourMonitoringPage.csvHeaders.totalWorkingHours'),
        t('workHourMonitoringPage.csvHeaders.status'),
        t('workHourMonitoringPage.csvHeaders.exceededHours'),
      ],
      ...employees.map(e => [
        e.employeeName,
        e.department,
        e.regularHours,
        e.overtimeHours,
        e.totalHours,
        t(`workHourMonitoringPage.statusLabels.${e.status}`),
        e.exceededHours,
      ]),
    ]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `work-hours-${searchState.weekPeriod}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // 모바일 레이아웃
  if (isMobile) {
    return (
      <PullToRefreshContainer onRefresh={handleRefresh}>
        <div className="space-y-4 pb-20">
          {/* 모바일 헤더 */}
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">{t('workHourMonitoringPage.title')}</h1>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4" />
            </Button>
          </div>

          {/* 초과 경고 알림 */}
          {exceededEmployees.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{t('workHourMonitoringPage.exceededAlert.mobileTitle')}</AlertTitle>
              <AlertDescription>
                {t('workHourMonitoringPage.exceededAlert.mobileDescription', { count: exceededEmployees.length })}
              </AlertDescription>
            </Alert>
          )}

          {/* 주간 네비게이터 - 컴팩트 */}
          <Card>
            <CardContent className="flex items-center justify-between py-3 px-4">
              <Button variant="ghost" size="icon" onClick={goToPreviousWeek}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div className="text-center flex-1">
                <p className="font-semibold">{searchState.weekPeriod}</p>
                {statistics && (
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(statistics.weekStartDate), 'M/d', { locale: ko })} ~{' '}
                    {format(new Date(statistics.weekEndDate), 'M/d', { locale: ko })}
                  </p>
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={goToNextWeek}>
                <ChevronRight className="h-5 w-5" />
              </Button>
            </CardContent>
          </Card>

          {/* 2x2 요약 그리드 */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-3 text-center">
                <Users className="mx-auto h-5 w-5 text-muted-foreground mb-1" />
                <p className="text-2xl font-bold">{summary?.totalEmployees ?? 0}</p>
                <p className="text-xs text-muted-foreground">{t('workHourMonitoringPage.summary.totalMobile')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <Clock className="mx-auto h-5 w-5 text-green-600 mb-1" />
                <p className="text-2xl font-bold text-green-600">{summary?.normalCount ?? 0}</p>
                <p className="text-xs text-muted-foreground">{t('workHourMonitoringPage.summary.normal')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <Clock className="mx-auto h-5 w-5 text-yellow-600 mb-1" />
                <p className="text-2xl font-bold text-yellow-600">{summary?.warningCount ?? 0}</p>
                <p className="text-xs text-muted-foreground">{t('workHourMonitoringPage.summary.warning')}</p>
              </CardContent>
            </Card>
            <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
              <CardContent className="p-3 text-center">
                <AlertTriangle className="mx-auto h-5 w-5 text-red-600 mb-1" />
                <p className="text-2xl font-bold text-red-600">{summary?.exceededCount ?? 0}</p>
                <p className="text-xs text-muted-foreground">{t('workHourMonitoringPage.summary.exceeded')}</p>
              </CardContent>
            </Card>
          </div>

          {/* 필터 토글 */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              {t('workHourMonitoringPage.filter.filterButton')}
              {(searchState.departmentId || searchState.status) && (
                <Badge variant="secondary" className="ml-1">{t('workHourMonitoringPage.filter.applied')}</Badge>
              )}
            </Button>
            {!isCurrentWeek && (
              <Button variant="outline" size="sm" onClick={goToCurrentWeek}>
                <RotateCcw className="mr-1 h-3 w-3" />
                {t('workHourMonitoringPage.thisWeek')}
              </Button>
            )}
          </div>

          {/* 필터 패널 */}
          {showFilters && (
            <Card>
              <CardContent className="p-4 space-y-3">
                <Select
                  value={searchState.departmentId || 'all'}
                  onValueChange={(value) => setDepartmentId(value === 'all' ? '' : value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('workHourMonitoringPage.filter.allDepartments')} />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-2 overflow-x-auto py-1">
                  {[
                    { value: '', label: t('workHourMonitoringPage.filter.all') },
                    { value: 'NORMAL', label: t('workHourMonitoringPage.filter.normal') },
                    { value: 'WARNING', label: t('workHourMonitoringPage.filter.warning') },
                    { value: 'EXCEEDED', label: t('workHourMonitoringPage.filter.exceeded') },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setStatus(option.value as WorkHourStatus | '')}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        (searchState.status || '') === option.value
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                {(searchState.departmentId || searchState.status) && (
                  <Button variant="ghost" size="sm" onClick={resetFilters} className="w-full">
                    {t('workHourMonitoringPage.filter.resetFilter')}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* 직원 카드 목록 */}
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : employees.length === 0 ? (
            <EmptyState
              icon={Users}
              title={t('workHourMonitoringPage.emptyState.title')}
              description={t('workHourMonitoringPage.emptyState.description')}
            />
          ) : (
            <div className="space-y-3">
              {employees.map((employee) => (
                <Card
                  key={employee.employeeId}
                  className={
                    employee.status === 'EXCEEDED'
                      ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/10'
                      : ''
                  }
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-medium">{employee.employeeName}</p>
                        <p className="text-sm text-muted-foreground">{employee.department}</p>
                      </div>
                      <WorkHourStatusBadge status={employee.status} />
                    </div>
                    <div className="mb-2">
                      <WorkHourProgressBar employee={employee} />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {t('workHourMonitoringPage.employeeCard.regularAndOvertime', { regular: employee.regularHours, overtime: employee.overtimeHours })}
                      </span>
                      {employee.exceededHours > 0 && (
                        <span className="font-medium text-red-600">
                          {t('workHourMonitoringPage.employeeCard.exceededBy', { hours: employee.exceededHours })}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </PullToRefreshContainer>
    );
  }

  // 데스크톱 레이아웃
  return (
    <>
      <PageHeader
        title={t('workHourMonitoringPage.title')}
        description={t('workHourMonitoringPage.description')}
        actions={
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            {t('workHourMonitoringPage.exportExcel')}
          </Button>
        }
      />

      {/* Exceeded Alert */}
      {exceededEmployees.length > 0 && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{t('workHourMonitoringPage.exceededAlert.title')}</AlertTitle>
          <AlertDescription>
            {t('workHourMonitoringPage.exceededAlert.description', { count: exceededEmployees.length })}
          </AlertDescription>
        </Alert>
      )}

      {/* Week Navigator */}
      <Card className="mb-6">
        <CardContent className="flex items-center justify-between py-4">
          <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-lg font-semibold">{searchState.weekPeriod}</p>
              {statistics && (
                <p className="text-sm text-muted-foreground">
                  {format(new Date(statistics.weekStartDate), 'M월 d일', { locale: ko })} ~{' '}
                  {format(new Date(statistics.weekEndDate), 'M월 d일', { locale: ko })}
                </p>
              )}
            </div>
            {!isCurrentWeek && (
              <Button variant="outline" size="sm" onClick={goToCurrentWeek}>
                <RotateCcw className="mr-2 h-3 w-3" />
                {t('workHourMonitoringPage.thisWeek')}
              </Button>
            )}
          </div>
          <Button variant="outline" size="icon" onClick={goToNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('workHourMonitoringPage.summary.totalEmployees')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{t('workHourMonitoringPage.summary.countUnit', { count: summary?.totalEmployees ?? 0 })}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-600">{t('workHourMonitoringPage.summary.normal')}</CardTitle>
            <Clock className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {t('workHourMonitoringPage.summary.countUnit', { count: summary?.normalCount ?? 0 })}
            </div>
            <p className="text-xs text-muted-foreground">{t('workHourMonitoringPage.summary.normalDesc')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600">{t('workHourMonitoringPage.summary.warning')}</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {t('workHourMonitoringPage.summary.countUnit', { count: summary?.warningCount ?? 0 })}
            </div>
            <p className="text-xs text-muted-foreground">{t('workHourMonitoringPage.summary.warningDesc')}</p>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-600">{t('workHourMonitoringPage.summary.exceeded')}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {t('workHourMonitoringPage.summary.countUnit', { count: summary?.exceededCount ?? 0 })}
            </div>
            <p className="text-xs text-muted-foreground">{t('workHourMonitoringPage.summary.exceededDesc')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="flex flex-wrap items-center gap-4 py-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{t('workHourMonitoringPage.filter.department')}</span>
            <Select
              value={searchState.departmentId || 'all'}
              onValueChange={(value) => setDepartmentId(value === 'all' ? '' : value)}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder={t('workHourMonitoringPage.filter.allDepartments')} />
              </SelectTrigger>
              <SelectContent>
                {DEPARTMENTS.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{t('workHourMonitoringPage.filter.status')}</span>
            <Select
              value={searchState.status || 'all'}
              onValueChange={(value) => setStatus(value === 'all' ? '' : value as WorkHourStatus)}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder={t('workHourMonitoringPage.filter.all')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('workHourMonitoringPage.filter.all')}</SelectItem>
                <SelectItem value="NORMAL">{t('workHourMonitoringPage.filter.normal')}</SelectItem>
                <SelectItem value="WARNING">{t('workHourMonitoringPage.filter.warning')}</SelectItem>
                <SelectItem value="EXCEEDED">{t('workHourMonitoringPage.filter.exceeded')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {(searchState.departmentId || searchState.status) && (
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              {t('workHourMonitoringPage.filter.resetFilter')}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Employee Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('workHourMonitoringPage.table.title')}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4">
              <SkeletonTable rows={5} />
            </div>
          ) : employees.length === 0 ? (
            <EmptyState
              icon={Users}
              title={t('workHourMonitoringPage.emptyState.title')}
              description={t('workHourMonitoringPage.emptyState.description')}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      {t('workHourMonitoringPage.table.employeeName')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      {t('workHourMonitoringPage.table.department')}
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                      {t('workHourMonitoringPage.table.regularHours')}
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                      {t('workHourMonitoringPage.table.overtimeHours')}
                    </th>
                    <th className="w-[250px] px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      {t('workHourMonitoringPage.table.totalWorkingHours')}
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                      {t('workHourMonitoringPage.table.status')}
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                      {t('workHourMonitoringPage.table.exceededHours')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee) => (
                    <tr
                      key={employee.employeeId}
                      className={`border-b transition-colors hover:bg-muted/50 ${
                        employee.status === 'EXCEEDED' ? 'bg-red-50 dark:bg-red-900/10' : ''
                      }`}
                    >
                      <td className="px-4 py-3 text-sm font-medium">
                        {employee.employeeName}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {employee.department}
                      </td>
                      <td className="px-4 py-3 text-right text-sm tabular-nums">
                        {employee.regularHours}h
                      </td>
                      <td className="px-4 py-3 text-right text-sm tabular-nums">
                        {employee.overtimeHours}h
                      </td>
                      <td className="px-4 py-3">
                        <WorkHourProgressBar employee={employee} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <WorkHourStatusBadge status={employee.status} />
                      </td>
                      <td className="px-4 py-3 text-right text-sm tabular-nums">
                        {employee.exceededHours > 0 ? (
                          <span className="font-medium text-red-600">
                            +{employee.exceededHours}h
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
