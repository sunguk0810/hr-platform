import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('dashboard');

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
      data-tour="leave-balance-widget"
      title={t('leave.title')}
      description={t('leave.description')}
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
            label={t('leave.annual')}
            used={data?.annual?.used ?? 0}
            total={data?.annual?.total ?? 0}
            remaining={data?.annual?.remaining ?? 0}
            t={t}
          />
          <BalanceBar
            label={t('leave.sick')}
            used={data?.sick?.used ?? 0}
            total={data?.sick?.total ?? 0}
            remaining={data?.sick?.remaining ?? 0}
            t={t}
          />
          <BalanceBar
            label={t('leave.special')}
            used={data?.special?.used ?? 0}
            total={data?.special?.total ?? 0}
            remaining={data?.special?.remaining ?? 0}
            t={t}
          />
        </div>

        {/* Upcoming leaves */}
        {data?.upcoming && data.upcoming.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              {t('leave.upcoming')}
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
                    {t('leave.daysCount', { count: leave.days })}
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
  t: (key: string, options?: Record<string, unknown>) => string;
}

function BalanceBar({ label, used, total, remaining, t }: BalanceBarProps) {
  const percentage = total > 0 ? (used / total) * 100 : 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">
          {remaining} {t('leave.days', { count: total })}
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-[width]"
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}
