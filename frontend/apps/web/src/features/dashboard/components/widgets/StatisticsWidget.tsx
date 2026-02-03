import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { WidgetContainer } from './WidgetContainer';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryClient';
import { cn } from '@/lib/utils';

interface StatItem {
  label: string;
  value: number;
  previousValue: number;
  unit?: string;
  format?: 'number' | 'percent' | 'hours';
}

interface StatisticsData {
  attendanceRate: StatItem;
  leaveUsageRate: StatItem;
  overtimeHours: StatItem;
  approvalProcessingTime: StatItem;
  employeeSatisfaction?: StatItem;
}

function formatValue(value: number, format?: string): string {
  switch (format) {
    case 'percent':
      return `${value.toFixed(1)}%`;
    case 'hours':
      return `${value.toFixed(1)}h`;
    default:
      return value.toLocaleString();
  }
}

function TrendIndicator({
  current,
  previous,
  inverseColor = false,
}: {
  current: number;
  previous: number;
  inverseColor?: boolean;
}) {
  const diff = current - previous;
  const percentChange = previous !== 0 ? (diff / previous) * 100 : 0;

  if (Math.abs(percentChange) < 0.1) {
    return (
      <span className="flex items-center text-xs text-muted-foreground">
        <Minus className="mr-0.5 h-3 w-3" />
        --
      </span>
    );
  }

  const isPositive = diff > 0;
  const colorClass = inverseColor
    ? isPositive
      ? 'text-red-600'
      : 'text-green-600'
    : isPositive
      ? 'text-green-600'
      : 'text-red-600';

  return (
    <span className={cn('flex items-center text-xs font-medium', colorClass)}>
      {isPositive ? (
        <TrendingUp className="mr-0.5 h-3 w-3" />
      ) : (
        <TrendingDown className="mr-0.5 h-3 w-3" />
      )}
      {Math.abs(percentChange).toFixed(1)}%
    </span>
  );
}

export function StatisticsWidget() {
  const { t } = useTranslation('dashboard');

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.dashboard.statistics(),
    queryFn: async () => {
      const response = await apiClient.get<{ data: StatisticsData }>(
        '/dashboard/statistics'
      );
      return response.data.data;
    },
  });

  const stats = [
    {
      key: 'attendanceRate',
      label: t('widgets.statistics.attendanceRate', '출근율'),
      data: data?.attendanceRate,
      inverseColor: false,
    },
    {
      key: 'leaveUsageRate',
      label: t('widgets.statistics.leaveUsageRate', '휴가 사용률'),
      data: data?.leaveUsageRate,
      inverseColor: false,
    },
    {
      key: 'overtimeHours',
      label: t('widgets.statistics.overtimeHours', '초과 근무'),
      data: data?.overtimeHours,
      inverseColor: true,
    },
    {
      key: 'approvalProcessingTime',
      label: t('widgets.statistics.approvalTime', '결재 처리 시간'),
      data: data?.approvalProcessingTime,
      inverseColor: true,
    },
  ];

  return (
    <WidgetContainer
      title={t('widgets.statistics.title', '주요 지표')}
      description={t('widgets.statistics.description', '이번 달 vs 지난 달')}
      isLoading={isLoading}
    >
      <div className="space-y-3">
        {stats.map((stat) => (
          <div
            key={stat.key}
            className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0"
          >
            <span className="text-sm text-muted-foreground">{stat.label}</span>
            <div className="flex items-center gap-2">
              <span className="font-semibold">
                {stat.data
                  ? formatValue(stat.data.value, stat.data.format)
                  : '--'}
              </span>
              {stat.data && (
                <TrendIndicator
                  current={stat.data.value}
                  previous={stat.data.previousValue}
                  inverseColor={stat.inverseColor}
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </WidgetContainer>
  );
}
