import type { ComponentType, LazyExoticComponent } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface RouteConfig {
  path: string;
  title: string;
  icon?: LucideIcon;
  element: LazyExoticComponent<ComponentType<unknown>>;
  permissions?: string[];
  roles?: string[];
  showInNav?: boolean;
  children?: Omit<RouteConfig, 'showInNav' | 'icon'>[];
}

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  permissions?: string[];
  roles?: string[];
}
