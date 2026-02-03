import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, LogIn, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WidgetContainer } from './WidgetContainer';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryClient';
import { cn } from '@/lib/utils';

interface AttendanceData {
  status: 'NOT_CHECKED_IN' | 'WORKING' | 'CHECKED_OUT';
  checkInTime: string | null;
  checkOutTime: string | null;
  workDuration: string;
  scheduledWorkHours: number;
  overtimeHours: number;
}

export function AttendanceWidget() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.dashboard.attendance(),
    queryFn: async () => {
      const response = await apiClient.get<{ data: AttendanceData }>('/dashboard/attendance');
      return response.data.data;
    },
  });

  const checkInMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/attendance/check-in');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.attendance() });
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/attendance/check-out');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.attendance() });
    },
  });

  const formatTime = (timeString: string | null) => {
    if (!timeString) return '--:--';
    const date = new Date(timeString);
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusText = (status: AttendanceData['status']) => {
    switch (status) {
      case 'NOT_CHECKED_IN':
        return '미출근';
      case 'WORKING':
        return '근무중';
      case 'CHECKED_OUT':
        return '퇴근완료';
      default:
        return '--';
    }
  };

  const getStatusColor = (status: AttendanceData['status']) => {
    switch (status) {
      case 'NOT_CHECKED_IN':
        return 'text-muted-foreground';
      case 'WORKING':
        return 'text-green-600';
      case 'CHECKED_OUT':
        return 'text-blue-600';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <WidgetContainer title="출퇴근" description="오늘의 근무 현황" isLoading={isLoading}>
      <div className="space-y-4">
        {/* Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">상태</span>
          <span className={cn('font-medium', data && getStatusColor(data.status))}>
            {data ? getStatusText(data.status) : '--'}
          </span>
        </div>

        {/* Times */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-xs text-muted-foreground">출근</p>
            <p className="mt-1 text-lg font-semibold">
              {formatTime(data?.checkInTime || null)}
            </p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-xs text-muted-foreground">퇴근</p>
            <p className="mt-1 text-lg font-semibold">
              {formatTime(data?.checkOutTime || null)}
            </p>
          </div>
        </div>

        {/* Work duration */}
        {data?.status === 'WORKING' && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>근무시간: {data.workDuration}</span>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          {data?.status === 'NOT_CHECKED_IN' && (
            <Button
              className="flex-1"
              onClick={() => checkInMutation.mutate()}
              disabled={checkInMutation.isPending}
            >
              <LogIn className="mr-2 h-4 w-4" />
              출근하기
            </Button>
          )}
          {data?.status === 'WORKING' && (
            <Button
              className="flex-1"
              variant="secondary"
              onClick={() => checkOutMutation.mutate()}
              disabled={checkOutMutation.isPending}
            >
              <LogOut className="mr-2 h-4 w-4" />
              퇴근하기
            </Button>
          )}
          {data?.status === 'CHECKED_OUT' && (
            <div className="flex-1 rounded-lg bg-green-50 p-3 text-center text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
              오늘 하루도 수고하셨습니다!
            </div>
          )}
        </div>
      </div>
    </WidgetContainer>
  );
}
