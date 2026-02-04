import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Users,
  Clock,
  Download,
  RotateCcw,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { SkeletonTable } from '@/components/common/Skeleton';
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
import type { WorkHourStatus, EmployeeWorkHours } from '@hr-platform/shared-types';

const STATUS_CONFIG: Record<WorkHourStatus, { label: string; color: string; bgColor: string }> = {
  NORMAL: { label: '정상', color: 'text-green-700', bgColor: 'bg-green-100' },
  WARNING: { label: '주의', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  EXCEEDED: { label: '초과', color: 'text-red-700', bgColor: 'bg-red-100' },
};

const DEPARTMENTS = [
  { id: 'all', name: '전체 부서' },
  { id: 'dept-001', name: '개발팀' },
  { id: 'dept-002', name: '인사팀' },
  { id: 'dept-003', name: '마케팅팀' },
  { id: 'dept-004', name: '영업팀' },
  { id: 'dept-005', name: '재무팀' },
];

function WorkHourStatusBadge({ status }: { status: WorkHourStatus }) {
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

  const handleExport = () => {
    // CSV export logic would go here
    const csvContent = [
      ['사원명', '부서', '기본근무', '초과근무', '총 근무시간', '상태', '초과시간'],
      ...employees.map(e => [
        e.employeeName,
        e.department,
        e.regularHours,
        e.overtimeHours,
        e.totalHours,
        STATUS_CONFIG[e.status].label,
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

  return (
    <>
      <PageHeader
        title="주 52시간 모니터링"
        description="직원별 주간 근무시간 현황을 확인하고 근로기준법 준수 여부를 모니터링합니다."
        actions={
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            엑셀 내보내기
          </Button>
        }
      />

      {/* Exceeded Alert */}
      {exceededEmployees.length > 0 && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>주 52시간 초과 감지</AlertTitle>
          <AlertDescription>
            {exceededEmployees.length}명의 직원이 주 52시간을 초과하였습니다.
            근로기준법 준수를 위해 조치가 필요합니다.
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
                이번 주
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
            <CardTitle className="text-sm font-medium">전체 직원</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalEmployees ?? 0}명</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-600">정상</CardTitle>
            <Clock className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {summary?.normalCount ?? 0}명
            </div>
            <p className="text-xs text-muted-foreground">48시간 미만</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600">주의</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {summary?.warningCount ?? 0}명
            </div>
            <p className="text-xs text-muted-foreground">48~52시간</p>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-600">초과</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {summary?.exceededCount ?? 0}명
            </div>
            <p className="text-xs text-muted-foreground">52시간 초과</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="flex flex-wrap items-center gap-4 py-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">부서</span>
            <Select
              value={searchState.departmentId || 'all'}
              onValueChange={(value) => setDepartmentId(value === 'all' ? '' : value)}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="전체 부서" />
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
            <span className="text-sm font-medium">상태</span>
            <Select
              value={searchState.status || 'all'}
              onValueChange={(value) => setStatus(value === 'all' ? '' : value as WorkHourStatus)}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="전체" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="NORMAL">정상</SelectItem>
                <SelectItem value="WARNING">주의</SelectItem>
                <SelectItem value="EXCEEDED">초과</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {(searchState.departmentId || searchState.status) && (
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              필터 초기화
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Employee Table */}
      <Card>
        <CardHeader>
          <CardTitle>직원별 근무시간 현황</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4">
              <SkeletonTable rows={5} />
            </div>
          ) : employees.length === 0 ? (
            <EmptyState
              icon={Users}
              title="데이터가 없습니다"
              description="해당 기간의 근무 데이터가 없습니다."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      사원명
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      부서
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                      기본근무
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                      초과근무
                    </th>
                    <th className="w-[250px] px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      총 근무시간
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                      상태
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                      초과시간
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
