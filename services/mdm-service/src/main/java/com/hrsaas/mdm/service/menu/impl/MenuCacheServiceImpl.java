package com.hrsaas.mdm.service.menu.impl;

import com.hrsaas.common.cache.CacheNames;
import com.hrsaas.mdm.domain.entity.menu.MenuItem;
import com.hrsaas.mdm.repository.menu.MenuItemRepository;
import com.hrsaas.mdm.service.menu.MenuCacheService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Implementation of MenuCacheService with Redis caching.
 *
 * Cache key strategy:
 * - menu:tenant:{tenantId} - Tenant-specific config (1h TTL)
 * - menu:user:{tenantId}:{userId} - User's computed menus (15m TTL)
 *
 * Note: menu:tree (global menu tree) is NOT cached because MenuItem JPA entities
 * have bidirectional relationships that cause infinite recursion during Redis serialization.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MenuCacheServiceImpl implements MenuCacheService {

    private final MenuItemRepository menuItemRepository;

    /**
     * Load all menus with permissions directly from the database.
     * <p>
     * NOTE: @Cacheable was intentionally removed because this method returns JPA entities
     * (MenuItem) with bidirectional relationships (parent/children self-reference,
     * permissions/menuItem). These cause infinite recursion during Redis serialization
     * with GenericJackson2JsonRedisSerializer, resulting in a 500 error on /api/v1/menus/me.
     * <p>
     * Menu data is only loaded at page initialization, so the performance impact is minimal.
     * If caching is needed in the future, convert to DTOs before caching.
     */
    @Override
    @Transactional(readOnly = true)
    public List<MenuItem> getAllMenusWithPermissions() {
        log.debug("Loading menus from database");
        return menuItemRepository.findAllWithPermissions();
    }

    @Override
    @Caching(evict = {
        @CacheEvict(value = CacheNames.MENU_TENANT, allEntries = true),
        @CacheEvict(value = CacheNames.MENU_USER, allEntries = true)
    })
    public void invalidateMenuCache() {
        log.info("Invalidated all menu caches");
    }

    @Override
    @Caching(evict = {
        @CacheEvict(value = CacheNames.MENU_TENANT, key = "#tenantId"),
        @CacheEvict(value = CacheNames.MENU_USER, allEntries = true)
    })
    public void invalidateTenantMenuCache(UUID tenantId) {
        log.info("Invalidated menu cache for tenant: {}", tenantId);
    }

    @Override
    @CacheEvict(value = CacheNames.MENU_USER, key = "#tenantId + ':' + #userId")
    public void invalidateUserMenuCache(UUID tenantId, UUID userId) {
        log.debug("Invalidated menu cache for user: {}", userId);
    }
}
