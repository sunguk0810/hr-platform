package com.hrsaas.mdm.service.menu;

import com.hrsaas.mdm.domain.entity.menu.MenuItem;

import java.util.List;
import java.util.UUID;

/**
 * Service interface for menu caching operations.
 */
public interface MenuCacheService {

    /**
     * Get all menus with permissions from cache or database.
     *
     * @return List of all active menu items with permissions
     */
    List<MenuItem> getAllMenusWithPermissions();

    /**
     * Invalidate all menu caches.
     */
    void invalidateMenuCache();

    /**
     * Invalidate cache for a specific tenant.
     *
     * @param tenantId Tenant ID
     */
    void invalidateTenantMenuCache(UUID tenantId);

    /**
     * Invalidate cache for a specific user.
     *
     * @param tenantId Tenant ID
     * @param userId User ID
     */
    void invalidateUserMenuCache(UUID tenantId, UUID userId);
}
