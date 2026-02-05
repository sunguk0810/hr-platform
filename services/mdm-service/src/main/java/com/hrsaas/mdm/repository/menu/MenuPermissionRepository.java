package com.hrsaas.mdm.repository.menu;

import com.hrsaas.mdm.domain.entity.menu.MenuPermission;
import com.hrsaas.mdm.domain.entity.menu.PermissionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repository for MenuPermission entity.
 */
@Repository
public interface MenuPermissionRepository extends JpaRepository<MenuPermission, UUID> {

    /**
     * Find all permissions for a menu item.
     */
    List<MenuPermission> findByMenuItemId(UUID menuItemId);

    /**
     * Find permissions by type for a menu item.
     */
    List<MenuPermission> findByMenuItemIdAndPermissionType(UUID menuItemId, PermissionType permissionType);

    /**
     * Check if a specific permission exists for a menu.
     */
    boolean existsByMenuItemIdAndPermissionTypeAndPermissionValue(
        UUID menuItemId,
        PermissionType permissionType,
        String permissionValue
    );

    /**
     * Delete all permissions for a menu item.
     */
    void deleteByMenuItemId(UUID menuItemId);

    /**
     * Find all menus that require a specific role.
     */
    @Query("SELECT mp.menuItem.id FROM MenuPermission mp WHERE mp.permissionType = 'ROLE' AND mp.permissionValue = :role")
    List<UUID> findMenuIdsByRole(@Param("role") String role);

    /**
     * Find all menus that require a specific permission.
     */
    @Query("SELECT mp.menuItem.id FROM MenuPermission mp WHERE mp.permissionType = 'PERMISSION' AND mp.permissionValue = :permission")
    List<UUID> findMenuIdsByPermission(@Param("permission") String permission);
}
