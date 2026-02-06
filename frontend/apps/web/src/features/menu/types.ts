/**
 * Menu types for dynamic menu system.
 */

export type MenuType = 'INTERNAL' | 'EXTERNAL' | 'DIVIDER' | 'HEADER';

/**
 * Menu item as returned from API.
 */
export interface MenuItemResponse {
  id: string;
  code: string;
  name: string;
  nameEn?: string;
  parentId?: string;
  path?: string;
  icon?: string;
  menuType: MenuType;
  externalUrl?: string;
  level: number;
  sortOrder: number;
  featureCode?: string;
  isSystem: boolean;
  isActive: boolean;
  showInNav: boolean;
  showInMobile: boolean;
  mobileSortOrder?: number;
  roles?: string[];
  permissions?: string[];
  children?: MenuItemResponse[];
  /** Menu group name for sidebar grouping (e.g., '메인', '인사관리', '근무관리') */
  groupName?: string;
}

/**
 * User's accessible menu item.
 */
export interface UserMenuItem {
  code: string;
  name: string;
  nameEn?: string;
  path?: string;
  icon?: string;
  externalUrl?: string;
  isExternal?: boolean;
  sortOrder: number;
  roles?: string[];
  permissions?: string[];
  children?: UserMenuItem[];
  /** Menu group name for sidebar grouping (e.g., '메인', '인사관리', '근무관리') */
  groupName?: string;
}

/**
 * Response from /api/v1/menus/me endpoint.
 */
export interface UserMenuResponse {
  sidebarMenus: UserMenuItem[];
  mobileMenus: UserMenuItem[];
}

/**
 * Tenant menu configuration.
 */
export interface TenantMenuConfigResponse {
  id: string;
  tenantId: string;
  menuItemId: string;
  menuCode: string;
  menuName: string;
  isEnabled: boolean;
  customName?: string;
  customSortOrder?: number;
  showInMobile?: boolean;
  mobileSortOrder?: number;
}

/**
 * Request to create a new menu item.
 */
export interface CreateMenuItemRequest {
  parentId?: string;
  code: string;
  name: string;
  nameEn?: string;
  path?: string;
  icon?: string;
  menuType?: MenuType;
  externalUrl?: string;
  sortOrder?: number;
  featureCode?: string;
  isSystem?: boolean;
  showInNav?: boolean;
  showInMobile?: boolean;
  mobileSortOrder?: number;
  roles?: string[];
  permissions?: string[];
}

/**
 * Request to update a menu item.
 */
export interface UpdateMenuItemRequest {
  parentId?: string;
  name?: string;
  nameEn?: string;
  path?: string;
  icon?: string;
  menuType?: MenuType;
  externalUrl?: string;
  sortOrder?: number;
  featureCode?: string;
  isActive?: boolean;
  showInNav?: boolean;
  showInMobile?: boolean;
  mobileSortOrder?: number;
  roles?: string[];
  permissions?: string[];
}

/**
 * Request to update tenant menu configuration.
 */
export interface UpdateTenantMenuConfigRequest {
  isEnabled?: boolean;
  customName?: string;
  customSortOrder?: number;
  showInMobile?: boolean;
  mobileSortOrder?: number;
}

/**
 * Menu reorder request.
 */
export interface MenuReorderRequest {
  items: {
    id: string;
    sortOrder: number;
    parentId?: string;
  }[];
}
