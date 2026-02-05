package com.hrsaas.mdm.repository.menu;

import com.hrsaas.mdm.domain.entity.menu.TenantMenuConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for TenantMenuConfig entity.
 */
@Repository
public interface TenantMenuConfigRepository extends JpaRepository<TenantMenuConfig, UUID> {

    /**
     * Find all menu configs for a tenant.
     */
    List<TenantMenuConfig> findByTenantId(UUID tenantId);

    /**
     * Find config for a specific menu and tenant.
     */
    Optional<TenantMenuConfig> findByTenantIdAndMenuItemId(UUID tenantId, UUID menuItemId);

    /**
     * Check if config exists for tenant and menu.
     */
    boolean existsByTenantIdAndMenuItemId(UUID tenantId, UUID menuItemId);

    /**
     * Find all enabled menus for a tenant.
     */
    @Query("SELECT tmc FROM TenantMenuConfig tmc WHERE tmc.tenantId = :tenantId AND tmc.isEnabled = true")
    List<TenantMenuConfig> findEnabledByTenantId(@Param("tenantId") UUID tenantId);

    /**
     * Find all disabled menus for a tenant.
     */
    @Query("SELECT tmc FROM TenantMenuConfig tmc WHERE tmc.tenantId = :tenantId AND tmc.isEnabled = false")
    List<TenantMenuConfig> findDisabledByTenantId(@Param("tenantId") UUID tenantId);

    /**
     * Find all mobile menus for a tenant.
     */
    @Query("SELECT tmc FROM TenantMenuConfig tmc WHERE tmc.tenantId = :tenantId AND tmc.showInMobile = true ORDER BY tmc.mobileSortOrder NULLS LAST")
    List<TenantMenuConfig> findMobileMenusByTenantId(@Param("tenantId") UUID tenantId);

    /**
     * Delete all configs for a tenant.
     */
    void deleteByTenantId(UUID tenantId);

    /**
     * Delete config for a specific menu and tenant.
     */
    void deleteByTenantIdAndMenuItemId(UUID tenantId, UUID menuItemId);

    /**
     * Find disabled menu IDs for a tenant.
     */
    @Query("SELECT tmc.menuItem.id FROM TenantMenuConfig tmc WHERE tmc.tenantId = :tenantId AND tmc.isEnabled = false")
    List<UUID> findDisabledMenuIdsByTenantId(@Param("tenantId") UUID tenantId);
}
