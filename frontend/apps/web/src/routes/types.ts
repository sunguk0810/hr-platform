import type { ComponentType, LazyExoticComponent } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface RouteChildConfig {
  path: string;
  title: string;
  element: LazyExoticComponent<ComponentType<unknown>>;
  permissions?: string[];
  roles?: string[];
  /** Show this child in navigation menu. Default: false for dynamic routes like ':id' */
  showInNav?: boolean;
}

export interface RouteConfig {
  path: string;
  title: string;
  icon?: LucideIcon;
  element: LazyExoticComponent<ComponentType<unknown>>;
  permissions?: string[];
  roles?: string[];
  showInNav?: boolean;
  children?: RouteChildConfig[];
}

export interface NavChildItem {
  title: string;
  href: string;
  permissions?: string[];
  roles?: string[];
}

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  permissions?: string[];
  roles?: string[];
  children?: NavChildItem[];
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}
