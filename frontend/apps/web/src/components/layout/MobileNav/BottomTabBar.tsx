import { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  Users,
  Calendar,
  FileCheck,
  Bell,
  LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNotificationStore } from '@/stores/notificationStore';
import { useMenuStore } from '@/stores/menuStore';
import { useAuthStore } from '@/stores/authStore';
import { getIconWithFallback } from '@/utils/iconMap';

interface TabItem {
  icon: LucideIcon;
  label: string;
  href: string;
  badge?: number;
}

// Default tabs as fallback
const defaultTabs: TabItem[] = [
  { icon: Home, label: '홈', href: '/' },
  { icon: Users, label: '조직', href: '/organization' },
  { icon: Calendar, label: '근태', href: '/attendance' },
  { icon: FileCheck, label: '결재', href: '/approvals' },
  { icon: Bell, label: '알림', href: '/notifications' },
];

export function BottomTabBar() {
  const location = useLocation();
  const { unreadCount } = useNotificationStore();
  const { mobileMenus, fetchMenus } = useMenuStore();
  const { isAuthenticated } = useAuthStore();

  // Fetch menus on mount if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchMenus();
    }
  }, [isAuthenticated, fetchMenus]);

  // Build tabs from dynamic menus or use defaults
  const tabs: TabItem[] = mobileMenus.length > 0
    ? mobileMenus.map((menu) => ({
        icon: getIconWithFallback(menu.icon, Home),
        label: menu.name,
        href: menu.path || '/',
        // Add notification badge for notifications menu
        badge: menu.code === 'NOTIFICATIONS' && unreadCount > 0 ? unreadCount : undefined,
      }))
    : defaultTabs.map((tab) => ({
        ...tab,
        badge: tab.href === '/notifications' && unreadCount > 0 ? unreadCount : undefined,
      }));

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      <div className="mx-auto flex h-16 max-w-md items-center justify-around px-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.href);

          return (
            <NavLink
              key={tab.href}
              to={tab.href}
              className={cn(
                'relative flex flex-1 flex-col items-center justify-center gap-1 py-2 transition-colors',
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div className="relative">
                <Icon className={cn('h-5 w-5', active && 'stroke-[2.5px]')} />
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </div>
              <span className={cn('text-[10px]', active && 'font-medium')}>
                {tab.label}
              </span>
              {active && (
                <span className="absolute top-0 h-0.5 w-8 rounded-full bg-primary" />
              )}
            </NavLink>
          );
        })}
      </div>
      {/* Safe area padding for iOS */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}

export default BottomTabBar;
