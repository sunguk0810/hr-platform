package com.hrsaas.mdm.service.menu;

import com.hrsaas.mdm.domain.dto.menu.*;
import com.hrsaas.mdm.domain.entity.menu.MenuItem;

import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * Service interface for menu management.
 */
public interface MenuService {

    // ============================================
    // User Menu Operations
    // ============================================

    /**
     * Get menus accessible by the current user.
     * Filters by user's roles, permissions, and tenant settings.
     *
     * @param tenantId User's tenant ID
     * @param userRoles User's roles (with ROLE_ prefix)
     * @param userPermissions User's permissions
     * @return User's accessible menus for sidebar and mobile
     */
    UserMenuResponse getUserMenus(UUID tenantId, Set<String> userRoles, Set<String> userPermissions);

    // ============================================
    // Admin Menu Operations
    // ============================================

    /**
     * Get all menus as a tree structure.
     *
     * @return List of top-level menus with children
     */
    List<MenuItemResponse> getAllMenusTree();

    /**
     * Get all menus as a flat list.
     *
     * @return List of all menu items
     */
    List<MenuItemResponse> getAllMenusFlat();

    /**
     * Get a specific menu by ID.
     *
     * @param id Menu ID
     * @return Menu item response
     */
    MenuItemResponse getMenuById(UUID id);

    /**
     * Get a specific menu by code.
     *
     * @param code Menu code
     * @return Menu item response
     */
    MenuItemResponse getMenuByCode(String code);

    /**
     * Create a new menu item.
     *
     * @param request Create request
     * @return Created menu item
     */
    MenuItemResponse createMenu(CreateMenuItemRequest request);

    /**
     * Update an existing menu item.
     *
     * @param id Menu ID
     * @param request Update request
     * @return Updated menu item
     */
    MenuItemResponse updateMenu(UUID id, UpdateMenuItemRequest request);

    /**
     * Delete a menu item (soft delete by setting isActive to false).
     * System menus cannot be deleted.
     *
     * @param id Menu ID
     */
    void deleteMenu(UUID id);

    /**
     * Reorder menu items.
     *
     * @param request Reorder request with new sort orders
     */
    void reorderMenus(MenuReorderRequest request);

    // ============================================
    // Tenant Configuration Operations
    // ============================================

    /**
     * Get tenant-specific menu configuration.
     *
     * @param tenantId Tenant ID
     * @param menuId Menu ID
     * @return Tenant menu config or null if not configured
     */
    TenantMenuConfigResponse getTenantMenuConfig(UUID tenantId, UUID menuId);

    /**
     * Get all menu configurations for a tenant.
     *
     * @param tenantId Tenant ID
     * @return List of tenant menu configs
     */
    List<TenantMenuConfigResponse> getTenantMenuConfigs(UUID tenantId);

    /**
     * Update tenant-specific menu configuration.
     *
     * @param tenantId Tenant ID
     * @param menuId Menu ID
     * @param request Update request
     * @return Updated config
     */
    TenantMenuConfigResponse updateTenantMenuConfig(UUID tenantId, UUID menuId, UpdateTenantMenuConfigRequest request);

    /**
     * Reset tenant menu configuration to defaults.
     *
     * @param tenantId Tenant ID
     * @param menuId Menu ID
     */
    void resetTenantMenuConfig(UUID tenantId, UUID menuId);

    /**
     * Reset all tenant menu configurations to defaults.
     *
     * @param tenantId Tenant ID
     */
    void resetAllTenantMenuConfigs(UUID tenantId);

    // ============================================
    // Internal Operations
    // ============================================

    /**
     * Get menu entity by ID (for internal use).
     *
     * @param id Menu ID
     * @return Menu entity
     */
    MenuItem getMenuEntityById(UUID id);
}
