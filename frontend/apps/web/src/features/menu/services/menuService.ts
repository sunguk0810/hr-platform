import { apiClient, ApiResponse } from '@/lib/apiClient';
import type {
  UserMenuResponse,
  MenuItemResponse,
  TenantMenuConfigResponse,
  CreateMenuItemRequest,
  UpdateMenuItemRequest,
  UpdateTenantMenuConfigRequest,
  MenuReorderRequest,
} from '../types';

/**
 * Menu API service.
 */
export const menuService = {
  // ============================================
  // User Menu Operations
  // ============================================

  /**
   * Get menus accessible by the current user.
   */
  async getMyMenus(): Promise<UserMenuResponse> {
    const response = await apiClient.get<ApiResponse<UserMenuResponse>>('/menus/me');
    return response.data.data;
  },

  // ============================================
  // Admin Menu Operations
  // ============================================

  /**
   * Get all menus as a tree structure.
   */
  async getAllMenusTree(): Promise<MenuItemResponse[]> {
    const response = await apiClient.get<ApiResponse<MenuItemResponse[]>>('/admin/menus');
    return response.data.data;
  },

  /**
   * Get all menus as a flat list.
   */
  async getAllMenusFlat(): Promise<MenuItemResponse[]> {
    const response = await apiClient.get<ApiResponse<MenuItemResponse[]>>('/admin/menus/flat');
    return response.data.data;
  },

  /**
   * Get a specific menu by ID.
   */
  async getMenuById(id: string): Promise<MenuItemResponse> {
    const response = await apiClient.get<ApiResponse<MenuItemResponse>>(`/admin/menus/${id}`);
    return response.data.data;
  },

  /**
   * Get a specific menu by code.
   */
  async getMenuByCode(code: string): Promise<MenuItemResponse> {
    const response = await apiClient.get<ApiResponse<MenuItemResponse>>(`/admin/menus/code/${code}`);
    return response.data.data;
  },

  /**
   * Create a new menu item.
   */
  async createMenu(request: CreateMenuItemRequest): Promise<MenuItemResponse> {
    const response = await apiClient.post<ApiResponse<MenuItemResponse>>('/admin/menus', request);
    return response.data.data;
  },

  /**
   * Update an existing menu item.
   */
  async updateMenu(id: string, request: UpdateMenuItemRequest): Promise<MenuItemResponse> {
    const response = await apiClient.put<ApiResponse<MenuItemResponse>>(`/admin/menus/${id}`, request);
    return response.data.data;
  },

  /**
   * Delete a menu item.
   */
  async deleteMenu(id: string): Promise<void> {
    await apiClient.delete(`/admin/menus/${id}`);
  },

  /**
   * Reorder menu items.
   */
  async reorderMenus(request: MenuReorderRequest): Promise<void> {
    await apiClient.patch('/admin/menus/reorder', request);
  },

  // ============================================
  // Tenant Menu Configuration
  // ============================================

  /**
   * Get all menu configurations for a tenant.
   */
  async getTenantMenuConfigs(tenantId: string): Promise<TenantMenuConfigResponse[]> {
    const response = await apiClient.get<ApiResponse<TenantMenuConfigResponse[]>>(
      `/tenants/${tenantId}/menus/config`
    );
    return response.data.data;
  },

  /**
   * Get configuration for a specific menu and tenant.
   */
  async getTenantMenuConfig(tenantId: string, menuId: string): Promise<TenantMenuConfigResponse | null> {
    const response = await apiClient.get<ApiResponse<TenantMenuConfigResponse>>(
      `/tenants/${tenantId}/menus/${menuId}/config`
    );
    return response.data.data;
  },

  /**
   * Update tenant-specific menu configuration.
   */
  async updateTenantMenuConfig(
    tenantId: string,
    menuId: string,
    request: UpdateTenantMenuConfigRequest
  ): Promise<TenantMenuConfigResponse> {
    const response = await apiClient.put<ApiResponse<TenantMenuConfigResponse>>(
      `/tenants/${tenantId}/menus/${menuId}/config`,
      request
    );
    return response.data.data;
  },

  /**
   * Reset a specific menu configuration to defaults.
   */
  async resetTenantMenuConfig(tenantId: string, menuId: string): Promise<void> {
    await apiClient.delete(`/tenants/${tenantId}/menus/${menuId}/config`);
  },

  /**
   * Reset all menu configurations for a tenant.
   */
  async resetAllTenantMenuConfigs(tenantId: string): Promise<void> {
    await apiClient.delete(`/tenants/${tenantId}/menus/config`);
  },
};
