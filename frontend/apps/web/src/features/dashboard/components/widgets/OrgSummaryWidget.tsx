import { useQuery } from '@tanstack/react-query';
import { Users, Building2, Briefcase, UserCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { WidgetContainer } from './WidgetContainer';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryClient';

interface OrgSummaryData {
  totalEmployees: number;
  activeEmployees: number;
  onLeaveEmployees: number;
  departmentCount: number;
  positionCount: number;
  newHiresThisMonth: number;
  resignedThisMonth: number;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  subValue?: string;
  className?: string;
}

function StatCard({ icon, label, value, subValue, className }: StatCardProps) {
  return (
    <div className={`rounded-lg border p-3 ${className ?? ''}`}>
      <div className="flex items-center gap-2">
        <div className="rounded-md bg-primary/10 p-2 text-primary">{icon}</div>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">{label}</p>
          <div className="flex items-baseline gap-1">
            <p className="text-lg font-semibold">{value.toLocaleString()}</p>
            {subValue && (
              <span className="text-xs text-muted-foreground">{subValue}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function OrgSummaryWidget() {
  const { t } = useTranslation('dashboard');

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.dashboard.orgSummary(),
    queryFn: async () => {
      const response = await apiClient.get<{ data: OrgSummaryData }>(
        '/dashboard/org-summary'
      );
      return response.data.data;
    },
  });

  return (
    <WidgetContainer
      title={t('widgets.orgSummary.title', '조직 현황')}
      description={t('widgets.orgSummary.description', '전체 조직 통계')}
      isLoading={isLoading}
    >
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={<Users className="h-4 w-4" />}
            label={t('widgets.orgSummary.totalEmployees', '전체 직원')}
            value={data?.totalEmployees ?? 0}
            subValue={`(${t('widgets.orgSummary.active', '재직')}: ${data?.activeEmployees ?? 0})`}
          />
          <StatCard
            icon={<UserCheck className="h-4 w-4" />}
            label={t('widgets.orgSummary.onLeave', '휴직 중')}
            value={data?.onLeaveEmployees ?? 0}
          />
          <StatCard
            icon={<Building2 className="h-4 w-4" />}
            label={t('widgets.orgSummary.departments', '부서')}
            value={data?.departmentCount ?? 0}
          />
          <StatCard
            icon={<Briefcase className="h-4 w-4" />}
            label={t('widgets.orgSummary.positions', '직위')}
            value={data?.positionCount ?? 0}
          />
        </div>

        {/* Monthly changes */}
        <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3 text-sm">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-muted-foreground">
                {t('widgets.orgSummary.newHires', '이번 달 입사')}:
              </span>{' '}
              <span className="font-medium text-green-600">
                +{data?.newHiresThisMonth ?? 0}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">
                {t('widgets.orgSummary.resigned', '퇴사')}:
              </span>{' '}
              <span className="font-medium text-red-600">
                -{data?.resignedThisMonth ?? 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    </WidgetContainer>
  );
}
