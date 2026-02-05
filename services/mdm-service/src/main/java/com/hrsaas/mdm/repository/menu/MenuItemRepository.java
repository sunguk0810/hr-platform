package com.hrsaas.mdm.repository.menu;

import com.hrsaas.mdm.domain.entity.menu.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for MenuItem entity.
 */
@Repository
public interface MenuItemRepository extends JpaRepository<MenuItem, UUID> {

    /**
     * Find menu item by unique code.
     */
    Optional<MenuItem> findByCode(String code);

    /**
     * Check if menu code exists.
     */
    boolean existsByCode(String code);

    /**
     * Find all top-level menus (no parent).
     */
    @Query("SELECT m FROM MenuItem m WHERE m.parent IS NULL AND m.isActive = true ORDER BY m.sortOrder")
    List<MenuItem> findAllTopLevel();

    /**
     * Find all active menus that should be shown in navigation.
     */
    @Query("SELECT m FROM MenuItem m WHERE m.isActive = true AND m.showInNav = true ORDER BY m.level, m.sortOrder")
    List<MenuItem> findAllActiveForNav();

    /**
     * Find all menus for mobile bottom tab bar.
     */
    @Query("SELECT m FROM MenuItem m WHERE m.isActive = true AND m.showInMobile = true ORDER BY m.mobileSortOrder NULLS LAST, m.sortOrder")
    List<MenuItem> findAllForMobile();

    /**
     * Find children of a menu item.
     */
    @Query("SELECT m FROM MenuItem m WHERE m.parent.id = :parentId AND m.isActive = true ORDER BY m.sortOrder")
    List<MenuItem> findChildrenByParentId(@Param("parentId") UUID parentId);

    /**
     * Find all menus with their permissions eagerly fetched.
     */
    @Query("SELECT DISTINCT m FROM MenuItem m LEFT JOIN FETCH m.permissions WHERE m.isActive = true ORDER BY m.level, m.sortOrder")
    List<MenuItem> findAllWithPermissions();

    /**
     * Find top-level menus with children and permissions eagerly fetched.
     */
    @Query("""
        SELECT DISTINCT m FROM MenuItem m
        LEFT JOIN FETCH m.permissions
        LEFT JOIN FETCH m.children c
        LEFT JOIN FETCH c.permissions
        WHERE m.parent IS NULL AND m.isActive = true
        ORDER BY m.sortOrder
        """)
    List<MenuItem> findAllTreeWithPermissions();

    /**
     * Find menus by feature code.
     */
    @Query("SELECT m FROM MenuItem m WHERE m.featureCode = :featureCode AND m.isActive = true")
    List<MenuItem> findByFeatureCode(@Param("featureCode") String featureCode);

    /**
     * Find all menu items ordered for tree display.
     */
    @Query("SELECT m FROM MenuItem m ORDER BY m.level, m.sortOrder")
    List<MenuItem> findAllOrdered();

    /**
     * Update sort order for multiple menu items.
     */
    @Query("UPDATE MenuItem m SET m.sortOrder = :sortOrder WHERE m.id = :id")
    void updateSortOrder(@Param("id") UUID id, @Param("sortOrder") Integer sortOrder);
}
