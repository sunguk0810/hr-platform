import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { getNavGroups } from '@/routes/config';
import type { NavItem, NavChildItem, NavGroup } from '@/routes/types';

export function MobileMenuDrawer() {
  const [open, setOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const location = useLocation();
  const { hasAnyPermission, hasAnyRole } = useAuthStore();
  const { t } = useTranslation('navigation');

  const navGroups = getNavGroups();

  // Filter items based on permissions and roles
  const filterItem = (item: NavItem | NavChildItem): boolean => {
    if (item.roles && !hasAnyRole(item.roles)) return false;
    if (item.permissions && !hasAnyPermission(item.permissions)) return false;
    return true;
  };

  const filteredGroups: NavGroup[] = navGroups
    .map((group) => ({
      ...group,
      items: group.items
        .filter(filterItem)
        .map((item) => ({
          ...item,
          children: item.children?.filter(filterItem),
        })),
    }))
    .filter((group) => group.items.length > 0);

  const toggleExpanded = (href: string) => {
    setExpandedItems((prev) =>
      prev.includes(href)
        ? prev.filter((h) => h !== href)
        : [...prev, href]
    );
  };

  const isActive = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  const handleNavigate = () => {
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">{t('openMenu')}</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] p-0">
        <SheetHeader className="border-b px-4 py-4">
          <SheetTitle className="text-left">{t('menu')}</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-65px)]">
          <nav className="space-y-4 p-4">
            {filteredGroups.map((group) => (
              <div key={group.title}>
                <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.title}
                </h3>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const hasChildren = item.children && item.children.length > 0;
                    const isExpanded = expandedItems.includes(item.href);
                    const Icon = item.icon;
                    const active = isActive(item.href);

                    if (hasChildren) {
                      return (
                        <div key={item.href}>
                          <button
                            onClick={() => toggleExpanded(item.href)}
                            className={cn(
                              'flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors',
                              active
                                ? 'bg-primary/10 text-primary'
                                : 'text-foreground hover:bg-muted'
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <Icon className="h-4 w-4" />
                              <span>{item.title}</span>
                            </div>
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                          {isExpanded && (
                            <div className="ml-6 mt-1 space-y-1 border-l pl-3">
                              {item.children!.map((child) => (
                                <NavLink
                                  key={child.href}
                                  to={child.href}
                                  onClick={handleNavigate}
                                  className={({ isActive: linkActive }) =>
                                    cn(
                                      'block rounded-md px-3 py-2 text-sm transition-colors',
                                      linkActive
                                        ? 'bg-primary/10 text-primary font-medium'
                                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                    )
                                  }
                                >
                                  {child.title}
                                </NavLink>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    }

                    return (
                      <NavLink
                        key={item.href}
                        to={item.href}
                        onClick={handleNavigate}
                        className={({ isActive: linkActive }) =>
                          cn(
                            'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                            linkActive
                              ? 'bg-primary/10 text-primary'
                              : 'text-foreground hover:bg-muted'
                          )
                        }
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
