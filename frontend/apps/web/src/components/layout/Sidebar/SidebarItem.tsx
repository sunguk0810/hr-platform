import { useState, ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronDown, LucideIcon } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

export interface SidebarItemProps {
  icon: LucideIcon;
  title: string;
  href?: string;
  collapsed?: boolean;
  badge?: ReactNode;
  children?: ReactNode;
  defaultOpen?: boolean;
}

export function SidebarItem({
  icon: Icon,
  title,
  href,
  collapsed = false,
  badge,
  children,
  defaultOpen = false,
}: SidebarItemProps) {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const hasChildren = Boolean(children);
  const isActive = href ? location.pathname === href || location.pathname.startsWith(`${href}/`) : false;

  // Simple link item (no children)
  if (!hasChildren && href) {
    const linkContent = (
      <NavLink
        to={href}
        className={({ isActive: linkActive }) =>
          cn(
            'flex items-center rounded-lg text-sm font-medium transition-colors',
            'hover:bg-accent hover:text-accent-foreground',
            linkActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground',
            collapsed
              ? 'justify-center w-10 h-10 mx-auto p-0'
              : 'gap-3 px-3 py-2'
          )
        }
        aria-current={isActive ? 'page' : undefined}
      >
        <Icon className="h-5 w-5 shrink-0" />
        {!collapsed && (
          <>
            <span className="flex-1">{title}</span>
            {badge}
          </>
        )}
      </NavLink>
    );

    if (collapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
          <TooltipContent side="right" className="flex items-center gap-2">
            {title}
            {badge}
          </TooltipContent>
        </Tooltip>
      );
    }

    return linkContent;
  }

  // Collapsible item with children
  if (collapsed) {
    // In collapsed mode, show tooltip with children as dropdown
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className={cn(
              'flex items-center justify-center rounded-lg w-10 h-10 mx-auto text-sm font-medium transition-colors',
              'hover:bg-accent hover:text-accent-foreground',
              isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="p-0">
          <div className="min-w-[150px] py-1">
            <div className="px-3 py-2 text-sm font-medium">{title}</div>
            <div className="border-t">{children}</div>
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button
          aria-expanded={isOpen}
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            'hover:bg-accent hover:text-accent-foreground',
            isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
          )}
        >
          <Icon className="h-5 w-5 shrink-0" />
          <span className="flex-1 text-left">{title}</span>
          {badge}
          <ChevronDown
            className={cn(
              'h-4 w-4 shrink-0 transition-transform duration-200',
              isOpen && 'rotate-180'
            )}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pl-4">{children}</CollapsibleContent>
    </Collapsible>
  );
}

export interface SidebarSubItemProps {
  title: string;
  href: string;
  badge?: ReactNode;
}

export function SidebarSubItem({ title, href, badge }: SidebarSubItemProps) {
  const location = useLocation();
  const isActive = location.pathname === href || location.pathname.startsWith(`${href}/`);

  return (
    <NavLink
      to={href}
      className={({ isActive: linkActive }) =>
        cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
          'hover:bg-accent hover:text-accent-foreground',
          linkActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
        )
      }
      aria-current={isActive ? 'page' : undefined}
    >
      <span className="flex-1">{title}</span>
      {badge}
    </NavLink>
  );
}

export default SidebarItem;
