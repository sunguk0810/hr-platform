import { PageHeader } from '@/components/common/PageHeader';
import { DashboardGrid } from '../components/DashboardGrid';
import { useAuthStore } from '@/stores/authStore';

export default function DashboardPage() {
  const { user } = useAuthStore();

  return (
    <>
      <PageHeader
        title={`안녕하세요, ${user?.name || '사용자'}님`}
        description="오늘의 업무 현황을 확인하세요."
      />
      <DashboardGrid />
    </>
  );
}
