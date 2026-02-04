import { useLocation } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useAuthStore } from '@/stores/authStore';
import { getNavItems } from '@/routes/config';
import type { NavItem, NavChildItem } from '@/routes/types';
import { SidebarItem, SidebarSubItem } from './SidebarItem';

interface SidebarNavProps {
  collapsed: boolean;
}

export function SidebarNav({ collapsed }: SidebarNavProps) {
  const location = useLocation();
  const { hasAnyPermission, hasAnyRole } = useAuthStore();

  // Get navigation items from route configuration (Single Source of Truth)
  const navItems = getNavItems();

  // Filter items based on permissions and roles
  const filterItem = (item: NavItem | NavChildItem): boolean => {
    if (item.roles && !hasAnyRole(item.roles)) return false;
    if (item.permissions && !hasAnyPermission(item.permissions)) return false;
    return true;
  };

  const filteredItems = navItems
    .filter(filterItem)
    .map((item) => ({
      ...item,
      children: item.children?.filter(filterItem),
    }));

  // Check if any child is active to auto-expand parent
  const isChildActive = (children?: NavChildItem[]) => {
    if (!children) return false;
    return children.some((child) => location.pathname.startsWith(child.href));
  };

  return (
    <TooltipProvider delayDuration={0}>
      <nav className="space-y-1 px-2">
        {filteredItems.map((item) => {
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
      </nav>
    </TooltipProvider>
  );
}
