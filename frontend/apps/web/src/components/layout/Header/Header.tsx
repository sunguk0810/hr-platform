import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell, Moon, Sun, Search, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { useTenantStore } from '@/stores/tenantStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { useLogout } from '@/features/auth/hooks/useAuth';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { TenantSwitcher } from './TenantSwitcher';
import { LanguageSwitcher } from './LanguageSwitcher';
import { MobileMenuDrawer } from '../MobileNav/MobileMenuDrawer';
import { cn } from '@/lib/utils';

export function Header() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentTenant: _currentTenant } = useTenantStore();
  const { theme, setTheme, sidebarCollapsed, toggleSidebar } = useUIStore();
  const { unreadCount } = useNotificationStore();
  const { mutate: logout } = useLogout();
  const isMobile = useIsMobile();
  const { t } = useTranslation('common');
  const { t: tNav } = useTranslation('navigation');
  const { t: tAuth } = useTranslation('auth');

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header
      className={cn(
        'fixed right-0 top-0 z-50 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300',
        // 모바일: left-0으로 전체 너비
        isMobile ? 'left-0' : (sidebarCollapsed ? 'left-16' : 'left-64')
      )}
    >
      <div className="flex items-center gap-4">
        {/* 모바일에서는 햄버거 메뉴 + 로고, 데스크톱에서는 사이드바 토글 */}
        {isMobile ? (
          <div className="flex items-center gap-2">
            <MobileMenuDrawer />
            <h1 className="text-lg font-semibold text-foreground">HR Platform</h1>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}

        {/* Tenant Switcher - 계열사 전환 (데스크톱만) */}
        <div className="hidden md:block">
          <TenantSwitcher />
        </div>

        {/* Search (데스크톱만) */}
        <div data-tour="header-search" className="relative hidden lg:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder={t('searchPlaceholder')}
            className="h-9 w-64 rounded-md border bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Language switcher */}
        <LanguageSwitcher />

        {/* Theme toggle */}
        <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label={t('toggleTheme')}>
          {theme === 'dark' ? (
            <Sun className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Moon className="h-5 w-5" aria-hidden="true" />
          )}
        </Button>

        {/* Notifications (모바일에서는 BottomTabBar에서 처리하므로 숨김) */}
        {!isMobile && (
          <Button
            data-tour="header-notifications"
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => navigate('/notifications')}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>
        )}

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button data-tour="header-user-menu" variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user?.profileImageUrl} alt={user?.name} />
                <AvatarFallback>
                  {user?.name ? getInitials(user.name) : 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.departmentName} / {user?.positionName}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/my-info')}>
              {tNav('myInfo')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              {tNav('settings')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => logout()} className="text-destructive">
              {tAuth('logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
