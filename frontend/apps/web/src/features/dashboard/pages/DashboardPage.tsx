import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('dashboard');
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
        title={t('greeting', { name: user?.name || t('defaultUser') })}
        description={t('description')}
        actions={<WidgetCustomizer />}
      />
      <DashboardGrid />
    </>
  );
}
