import { useQuery } from '@tanstack/react-query';
import { Calendar, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { WidgetContainer } from './WidgetContainer';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryClient';

interface LeaveBalance {
  total: number;
  used: number;
  remaining: number;
}

interface UpcomingLeave {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  days: number;
  status: string;
}

interface LeaveBalanceData {
  annual: LeaveBalance;
  sick: LeaveBalance;
  special: LeaveBalance;
  upcoming: UpcomingLeave[];
}

export function LeaveBalanceWidget() {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.dashboard.leaveBalance(),
    queryFn: async () => {
      const response = await apiClient.get<{ data: LeaveBalanceData }>('/dashboard/leave-balance');
      return response.data.data;
    },
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <WidgetContainer
      title="연차 현황"
      description="남은 휴가 일수"
      isLoading={isLoading}
      action={
        <Button variant="ghost" size="sm" asChild>
          <Link to="/attendance/leave">
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      }
    >
      <div className="space-y-4">
        {/* Balance bars */}
        <div className="space-y-3">
          <BalanceBar
            label="연차"
            used={data?.annual.used || 0}
            total={data?.annual.total || 0}
            remaining={data?.annual.remaining || 0}
          />
          <BalanceBar
            label="병가"
            used={data?.sick.used || 0}
            total={data?.sick.total || 0}
            remaining={data?.sick.remaining || 0}
          />
          <BalanceBar
            label="특별휴가"
            used={data?.special.used || 0}
            total={data?.special.total || 0}
            remaining={data?.special.remaining || 0}
          />
        </div>

        {/* Upcoming leaves */}
        {data?.upcoming && data.upcoming.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              예정된 휴가
            </p>
            <div className="space-y-2">
              {data.upcoming.slice(0, 2).map((leave) => (
                <div
                  key={leave.id}
                  className="flex items-center gap-2 rounded-lg bg-muted/50 p-2 text-sm"
                >
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1">
                    {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {leave.days}일
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </WidgetContainer>
  );
}

interface BalanceBarProps {
  label: string;
  used: number;
  total: number;
  remaining: number;
}

function BalanceBar({ label, used, total, remaining }: BalanceBarProps) {
  const percentage = total > 0 ? (used / total) * 100 : 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">
          {remaining} / {total}일
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}
