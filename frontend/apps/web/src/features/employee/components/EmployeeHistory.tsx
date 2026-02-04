import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useEmployeeHistory, useHistorySearchParams } from '../hooks/useEmployees';
import type { HistoryType, EmployeeHistory as EmployeeHistoryType } from '@hr-platform/shared-types';
import {
  History,
  RefreshCw,
  UserPlus,
  Edit,
  ArrowRightLeft,
  TrendingUp,
  LogOut,
  RotateCcw,
  Building2,
  Award,
  Briefcase,
} from 'lucide-react';

interface EmployeeHistoryProps {
  employeeId: string;
}

const historyTypeOptions: { value: HistoryType | ''; label: string }[] = [
  { value: '', label: '전체' },
  { value: 'CREATE', label: '입사' },
  { value: 'UPDATE', label: '정보변경' },
  { value: 'STATUS_CHANGE', label: '상태변경' },
  { value: 'TRANSFER', label: '전출/전입' },
  { value: 'PROMOTION', label: '승진' },
  { value: 'RESIGNATION', label: '퇴직' },
  { value: 'REINSTATEMENT', label: '복직' },
  { value: 'DEPARTMENT_CHANGE', label: '부서이동' },
  { value: 'GRADE_CHANGE', label: '직급변경' },
  { value: 'POSITION_CHANGE', label: '직책변경' },
];

function getHistoryIcon(historyType: HistoryType) {
  const iconMap: Record<HistoryType, React.ReactNode> = {
    CREATE: <UserPlus className="h-4 w-4" />,
    UPDATE: <Edit className="h-4 w-4" />,
    STATUS_CHANGE: <RefreshCw className="h-4 w-4" />,
    TRANSFER: <ArrowRightLeft className="h-4 w-4" />,
    PROMOTION: <TrendingUp className="h-4 w-4" />,
    RESIGNATION: <LogOut className="h-4 w-4" />,
    REINSTATEMENT: <RotateCcw className="h-4 w-4" />,
    DEPARTMENT_CHANGE: <Building2 className="h-4 w-4" />,
    GRADE_CHANGE: <Award className="h-4 w-4" />,
    POSITION_CHANGE: <Briefcase className="h-4 w-4" />,
  };
  return iconMap[historyType] || <History className="h-4 w-4" />;
}

function getHistoryColor(historyType: HistoryType): string {
  const colorMap: Record<HistoryType, string> = {
    CREATE: 'bg-green-500',
    UPDATE: 'bg-blue-500',
    STATUS_CHANGE: 'bg-yellow-500',
    TRANSFER: 'bg-purple-500',
    PROMOTION: 'bg-emerald-500',
    RESIGNATION: 'bg-gray-500',
    REINSTATEMENT: 'bg-teal-500',
    DEPARTMENT_CHANGE: 'bg-indigo-500',
    GRADE_CHANGE: 'bg-orange-500',
    POSITION_CHANGE: 'bg-pink-500',
  };
  return colorMap[historyType] || 'bg-gray-500';
}

function HistoryItem({ history }: { history: EmployeeHistoryType }) {
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('ko-KR'),
      time: date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const { date, time } = formatDateTime(history.changedAt);

  return (
    <div className="flex gap-4">
      {/* Timeline indicator */}
      <div className="flex flex-col items-center">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full text-white ${getHistoryColor(
            history.historyType
          )}`}
        >
          {getHistoryIcon(history.historyType)}
        </div>
        <div className="flex-1 w-px bg-border" />
      </div>

      {/* Content */}
      <div className="flex-1 pb-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-medium">{history.historyTypeName}</p>
            {history.changedFieldName && (
              <p className="text-sm text-muted-foreground">{history.changedFieldName}</p>
            )}
          </div>
          <div className="text-right text-sm text-muted-foreground">
            <div>{date}</div>
            <div>{time}</div>
          </div>
        </div>

        {/* Value changes */}
        {(history.oldValue || history.newValue) && (
          <div className="mt-2 rounded-lg bg-muted/50 p-3 text-sm">
            {history.oldValue && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">이전:</span>
                <span className="line-through">{history.oldValue}</span>
              </div>
            )}
            {history.newValue && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">변경:</span>
                <span className="font-medium">{history.newValue}</span>
              </div>
            )}
          </div>
        )}

        {/* Reason */}
        {history.reason && (
          <p className="mt-2 text-sm text-muted-foreground">사유: {history.reason}</p>
        )}

        {/* Metadata */}
        <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
          <span>변경자: {history.changedByName}</span>
          {history.ipAddress && <span>IP: {history.ipAddress}</span>}
        </div>
      </div>
    </div>
  );
}

export function EmployeeHistory({ employeeId }: EmployeeHistoryProps) {
  const { params, searchState, setHistoryType, setPage, resetFilters } = useHistorySearchParams();
  const { data, isLoading, refetch } = useEmployeeHistory(employeeId, params);

  const histories = data?.data?.content ?? [];
  const totalPages = data?.data?.totalPages ?? 0;
  const totalElements = data?.data?.totalElements ?? 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            인사정보 변경 이력
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            인사정보 변경 이력
            {totalElements > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                ({totalElements}건)
              </span>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select
              value={searchState.historyType}
              onValueChange={(value) => setHistoryType(value as HistoryType | '')}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="유형 필터" />
              </SelectTrigger>
              <SelectContent>
                {historyTypeOptions.map((option) => (
                  <SelectItem key={option.value || 'all'} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            {searchState.historyType && (
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                필터 초기화
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {histories.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            변경 이력이 없습니다.
          </div>
        ) : (
          <>
            <div className="space-y-0">
              {histories.map((history) => (
                <HistoryItem
                  key={history.id}
                  history={history}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(searchState.page - 1)}
                  disabled={searchState.page === 0}
                >
                  이전
                </Button>
                <span className="flex items-center px-3 text-sm">
                  {searchState.page + 1} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(searchState.page + 1)}
                  disabled={searchState.page >= totalPages - 1}
                >
                  다음
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
