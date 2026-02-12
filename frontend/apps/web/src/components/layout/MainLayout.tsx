import { Outlet } from 'react-router-dom';
import { Suspense } from 'react';
import { Header } from './Header/Header';
import { Sidebar } from './Sidebar/Sidebar';
import { BottomTabBar } from './MobileNav/BottomTabBar';
import { PageLoader } from '@/components/common/PageLoader';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { SkipNavigation, LiveRegionProvider } from '@/components/a11y';
import { HelpPanel, OnboardingTour } from '@/features/help';
import { useUIStore } from '@/stores/uiStore';
import { useIsMobile } from '@/hooks/useMediaQuery';
import {
  useRealTimeNotification,
  useApprovalRealTime,
  useAttendanceRealTime,
} from '@/hooks/useRealTimeNotification';
import { cn } from '@/lib/utils';

export function MainLayout() {
  const sidebarCollapsed = useUIStore(state => state.sidebarCollapsed);
  const isMobile = useIsMobile();

  // Initialize Real-Time Notifications
  useRealTimeNotification();
  useApprovalRealTime();
  useAttendanceRealTime();

  return (
    <LiveRegionProvider>
      <SkipNavigation />
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Sidebar - 데스크톱에서만 표시 */}
        {!isMobile && <Sidebar />}

        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <main
            id="main-content"
            tabIndex={-1}
            className={cn(
              'flex-1 overflow-auto transition-[margin,padding] duration-300 focus:outline-none',
              // 모바일: padding 조정, margin 없음, 하단 탭바 공간 확보
              isMobile ? 'p-4 pt-20 pb-20' : 'p-6 pt-20',
              // 데스크톱: 사이드바에 따라 margin 조정
              !isMobile && (sidebarCollapsed ? 'ml-16' : 'ml-64')
            )}
          >
            <ErrorBoundary>
              <Suspense fallback={<PageLoader />}>
                <Outlet />
              </Suspense>
            </ErrorBoundary>
          </main>
        </div>

        {/* BottomTabBar - 모바일에서만 표시 */}
        {isMobile && <BottomTabBar />}

        <HelpPanel />
        <OnboardingTour />
      </div>
    </LiveRegionProvider>
  );
}
