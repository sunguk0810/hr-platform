import { useEffect, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useAuthStore } from '@/stores/authStore';
import { useMenuStore } from '@/stores/menuStore';
import { getNavGroups } from '@/routes/config';
import { getIconWithFallback } from '@/utils/iconMap';
import { Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NavChildItem, NavGroup } from '@/routes/types';
import type { UserMenuItem } from '@/features/menu/types';
import { SidebarItem, SidebarSubItem } from './SidebarItem';

interface SidebarNavProps {
  collapsed: boolean;
}

/**
 * SidebarNav component with dynamic menu support.
 *
 * Fetches menus from API and falls back to static route configuration
 * if API is unavailable.
 */
export function SidebarNav({ collapsed }: SidebarNavProps) {
  const location = useLocation();
  const hasAnyPermission = useAuthStore(state => state.hasAnyPermission);
  const hasAnyRole = useAuthStore(state => state.hasAnyRole);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const sidebarMenus = useMenuStore(state => state.sidebarMenus);
  const fetchMenus = useMenuStore(state => state.fetchMenus);
  const { t } = useTranslation('navigation');

  // Fetch menus on mount if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchMenus();
    }
  }, [isAuthenticated, fetchMenus]);

  // Use dynamic menus if available, otherwise fall back to static config
  const useDynamicMenus = sidebarMenus.length > 0;

  // Check if any child is active to auto-expand parent
  const isChildActive = useCallback((children?: NavChildItem[] | UserMenuItem[]) => {
    if (!children) return false;
    return children.some((child) => {
      const href = 'href' in child ? child.href : child.path;
      return href && location.pathname.startsWith(href);
    });
  }, [location.pathname]);

  // Filter items based on permissions and roles (shared for both dynamic and static menus)
  const filterMenuItem = useCallback((item: { roles?: string[]; permissions?: string[] }): boolean => {
    if (item.roles && item.roles.length > 0 && !hasAnyRole(item.roles)) return false;
    if (item.permissions && item.permissions.length > 0 && !hasAnyPermission(item.permissions)) return false;
    return true;
  }, [hasAnyRole, hasAnyPermission]);

  // Filter dynamic menus by user's roles and permissions (always computed, used only when dynamic)
  const filteredMenus = useMemo(() => sidebarMenus
    .filter(filterMenuItem)
    .map((menu) => ({
      ...menu,
      children: menu.children?.filter(filterMenuItem),
    })), [sidebarMenus, filterMenuItem]);

  // Group menus by groupName (always computed, used only when dynamic)
  const menuGroups = useMemo(() => filteredMenus.reduce((acc, menu) => {
    const groupName = menu.groupName || t('other');
    if (!acc[groupName]) {
      acc[groupName] = [];
    }
    acc[groupName].push(menu);
    return acc;
  }, {} as Record<string, UserMenuItem[]>), [filteredMenus, t]);

  // Render dynamic menus from API
  if (useDynamicMenus) {
    const groupNames = Object.keys(menuGroups);

    return (
      <TooltipProvider delayDuration={0}>
        <nav aria-label={t('mainMenu')} className={cn('space-y-4', collapsed ? 'px-1' : 'px-2')}>
          {groupNames.map((groupName, groupIndex) => (
            <div key={groupName} role="group" aria-labelledby={`nav-group-dyn-${groupIndex}`}>
              {/* Group header - hide when collapsed */}
              {!collapsed && (
                <h3
                  id={`nav-group-dyn-${groupIndex}`}
                  className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70"
                >
                  {groupName}
                </h3>
              )}
              <div
                className={cn(
                  'space-y-1',
                  collapsed && groupIndex > 0 && 'pt-2 border-t border-border/50',
                  collapsed && 'flex flex-col items-center'
                )}
              >
                {menuGroups[groupName].map((menu) => {
                  const Icon = getIconWithFallback(menu.icon, Circle);
                  const hasChildren = menu.children && menu.children.length > 0;
                  const shouldDefaultOpen = isChildActive(menu.children);

                  if (hasChildren) {
                    return (
                      <SidebarItem
                        key={menu.code}
                        icon={Icon}
                        title={menu.name}
                        collapsed={collapsed}
                        defaultOpen={shouldDefaultOpen}
                      >
                        {menu.children!.map((child) => (
                          <SidebarSubItem
                            key={child.code}
                            title={child.name}
                            href={child.path || '#'}
                          />
                        ))}
                      </SidebarItem>
                    );
                  }

                  return (
                    <SidebarItem
                      key={menu.code}
                      icon={Icon}
                      title={menu.name}
                      href={menu.isExternal ? undefined : menu.path}
                      collapsed={collapsed}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </TooltipProvider>
    );
  }

  // Fall back to static navigation from route configuration
  const navGroups = getNavGroups();

  const filteredGroups: NavGroup[] = navGroups
    .map((group) => ({
      ...group,
      items: group.items
        .filter(filterMenuItem)
        .map((item) => ({
          ...item,
          children: item.children?.filter(filterMenuItem),
        })),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <TooltipProvider delayDuration={0}>
      <nav aria-label={t('mainMenu')} className={cn('space-y-4', collapsed ? 'px-1' : 'px-2')}>
        {filteredGroups.map((group, groupIndex) => (
          <div key={group.title} role="group" aria-labelledby={`nav-group-${groupIndex}`}>
            {/* Group header - hide when collapsed */}
            {!collapsed && (
              <h3
                id={`nav-group-${groupIndex}`}
                className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70"
              >
                {group.title}
              </h3>
            )}
            <div
              className={cn(
                'space-y-1',
                collapsed && groupIndex > 0 && 'pt-2 border-t border-border/50',
                collapsed && 'flex flex-col items-center'
              )}
            >
              {group.items.map((item) => {
                const hasChildren = item.children && item.children.length > 0;
                const shouldDefaultOpen = isChildActive(item.children);

                if (hasChildren) {
                  return (
                    <SidebarItem
                      key={item.href}
                      icon={item.icon}
                      title={item.title}
                      collapsed={collapsed}
                      defaultOpen={shouldDefaultOpen}
                    >
                      {item.children!.map((child) => (
                        <SidebarSubItem
                          key={child.href}
                          title={child.title}
                          href={child.href}
                        />
                      ))}
                    </SidebarItem>
                  );
                }

                return (
                  <SidebarItem
                    key={item.href}
                    icon={item.icon}
                    title={item.title}
                    href={item.href}
                    collapsed={collapsed}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </TooltipProvider>
  );
}
