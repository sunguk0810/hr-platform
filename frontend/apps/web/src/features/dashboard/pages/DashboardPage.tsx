import { useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/common/PageHeader';
import { DashboardGrid } from '../components/DashboardGrid';
import { MobileDashboard } from '../components/MobileDashboard';
import { WidgetCustomizer } from '../components/WidgetCustomizer';
import { useAuthStore } from '@/stores/authStore';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { PullToRefreshContainer } from '@/components/mobile';
import { queryKeys } from '@/lib/queryClient';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
  };

  // Mobile Layout
  if (isMobile) {
    return (
      <PullToRefreshContainer onRefresh={handleRefresh}>
        <MobileDashboard userName={user?.name} />
      </PullToRefreshContainer>
    );
  }

  // Desktop Layout
  return (
    <>
      <PageHeader
        title={`안녕하세요, ${user?.name || '사용자'}님`}
        description="오늘의 업무 현황을 확인하세요."
        actions={<WidgetCustomizer />}
      />
      <DashboardGrid />
    </>
  );
}
