package com.hrsaas.mdm.service.menu.impl;

import com.hrsaas.common.core.exception.NotFoundException;
import com.hrsaas.common.core.exception.ValidationException;
import com.hrsaas.mdm.domain.dto.menu.*;
import com.hrsaas.mdm.domain.entity.menu.*;
import com.hrsaas.mdm.repository.menu.*;
import com.hrsaas.mdm.service.menu.MenuCacheService;
import com.hrsaas.mdm.service.menu.MenuService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Implementation of MenuService.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MenuServiceImpl implements MenuService {

    private final MenuItemRepository menuItemRepository;
    private final MenuPermissionRepository menuPermissionRepository;
    private final TenantMenuConfigRepository tenantMenuConfigRepository;
    private final MenuCacheService menuCacheService;

    // ============================================
    // User Menu Operations
    // ============================================

    @Override
    @Transactional(readOnly = true)
    public UserMenuResponse getUserMenus(UUID tenantId, Set<String> userRoles, Set<String> userPermissions) {
        // Get all menus with permissions
        List<MenuItem> allMenus = menuCacheService.getAllMenusWithPermissions();

        // Get tenant-disabled menus
        Set<UUID> disabledMenuIds = new HashSet<>(
            tenantMenuConfigRepository.findDisabledMenuIdsByTenantId(tenantId)
        );

        // Get tenant configs for customization
        Map<UUID, TenantMenuConfig> tenantConfigs = tenantMenuConfigRepository.findByTenantId(tenantId)
            .stream()
            .collect(Collectors.toMap(c -> c.getMenuItem().getId(), c -> c));

        // Filter menus based on permissions and tenant settings
        List<MenuItem> accessibleMenus = allMenus.stream()
            .filter(menu -> !disabledMenuIds.contains(menu.getId()))
            .filter(menu -> canAccessMenu(menu, userRoles, userPermissions))
            .collect(Collectors.toList());

        // Build sidebar menus (hierarchical)
        List<UserMenuResponse.UserMenuItem> sidebarMenus = buildSidebarMenus(
            accessibleMenus, tenantConfigs, userRoles, userPermissions
        );

        // Build mobile menus (flat, filtered by showInMobile)
        List<UserMenuResponse.UserMenuItem> mobileMenus = buildMobileMenus(
            accessibleMenus, tenantConfigs
        );

        return UserMenuResponse.builder()
            .sidebarMenus(sidebarMenus)
            .mobileMenus(mobileMenus)
            .build();
    }

    private boolean canAccessMenu(MenuItem menu, Set<String> userRoles, Set<String> userPermissions) {
        if (!menu.getIsActive() || !menu.getShowInNav()) {
            return false;
        }

        // Global wildcard: users with "*" permission can access all menus
        if (userPermissions.contains("*") || userPermissions.contains("*:*")) {
            return true;
        }

        Collection<MenuPermission> requiredPermissions = menu.getPermissions();
        if (requiredPermissions == null || requiredPermissions.isEmpty()) {
            return true; // No permissions required
        }

        // Check if user has any required role
        // Support both "ROLE_XXX" and "XXX" format in userRoles
        boolean hasRequiredRole = requiredPermissions.stream()
            .filter(MenuPermission::isRole)
            .anyMatch(p -> userRoles.contains("ROLE_" + p.getPermissionValue())
                        || userRoles.contains(p.getPermissionValue()));

        // Check if user has any required permission
        boolean hasRequiredPermission = requiredPermissions.stream()
            .filter(MenuPermission::isPermission)
            .anyMatch(p -> hasPermission(userPermissions, p.getPermissionValue()));

        // User needs either a matching role OR a matching permission
        boolean hasRoleRequirements = requiredPermissions.stream().anyMatch(MenuPermission::isRole);
        boolean hasPermRequirements = requiredPermissions.stream().anyMatch(MenuPermission::isPermission);

        if (hasRoleRequirements && hasPermRequirements) {
            return hasRequiredRole || hasRequiredPermission;
        } else if (hasRoleRequirements) {
            return hasRequiredRole;
        } else if (hasPermRequirements) {
            return hasRequiredPermission;
        }

        return true;
    }

    private boolean hasPermission(Set<String> userPermissions, String required) {
        if (userPermissions.contains("*") || userPermissions.contains("*:*")) return true;
        if (userPermissions.contains(required)) return true;

        // Check wildcard patterns
        String[] parts = required.split(":");
        if (parts.length >= 2) {
            String resourceWildcard = parts[0] + ":*";
            if (userPermissions.contains(resourceWildcard)) return true;

            // Check broader scope
            if (parts.length == 3) {
                String broaderPerm = parts[0] + ":" + parts[1];
                if (userPermissions.contains(broaderPerm)) return true;
            }
        }
        return false;
    }

    private List<UserMenuResponse.UserMenuItem> buildSidebarMenus(
            List<MenuItem> menus,
            Map<UUID, TenantMenuConfig> tenantConfigs,
            Set<String> userRoles,
            Set<String> userPermissions) {

        // Group by parent
        Map<UUID, List<MenuItem>> byParent = new HashMap<>();
        List<MenuItem> topLevel = new ArrayList<>();

        for (MenuItem menu : menus) {
            if (menu.getParent() == null) {
                topLevel.add(menu);
            } else {
                byParent.computeIfAbsent(menu.getParent().getId(), k -> new ArrayList<>()).add(menu);
            }
        }

        // Sort top level
        topLevel.sort(Comparator.comparing(m -> getEffectiveSortOrder(m, tenantConfigs.get(m.getId()))));

        // Build response
        return topLevel.stream()
            .map(menu -> buildUserMenuItem(menu, byParent, tenantConfigs, userRoles, userPermissions))
            .collect(Collectors.toList());
    }

    private UserMenuResponse.UserMenuItem buildUserMenuItem(
            MenuItem menu,
            Map<UUID, List<MenuItem>> byParent,
            Map<UUID, TenantMenuConfig> tenantConfigs,
            Set<String> userRoles,
            Set<String> userPermissions) {

        TenantMenuConfig config = tenantConfigs.get(menu.getId());
        List<MenuItem> children = byParent.get(menu.getId());
        List<UserMenuResponse.UserMenuItem> childItems = null;

        if (children != null && !children.isEmpty()) {
            // Filter children by permissions
            children = children.stream()
                .filter(c -> canAccessMenu(c, userRoles, userPermissions))
                .collect(Collectors.toList());

            // Sort children
            children.sort(Comparator.comparing(c -> getEffectiveSortOrder(c, tenantConfigs.get(c.getId()))));

            childItems = children.stream()
                .map(c -> buildUserMenuItem(c, byParent, tenantConfigs, userRoles, userPermissions))
                .collect(Collectors.toList());
        }

        return createUserMenuItemBuilder(menu, config)
            .sortOrder(getEffectiveSortOrder(menu, config))
            .children(childItems)
            .build();
    }

    private List<UserMenuResponse.UserMenuItem> buildMobileMenus(
            List<MenuItem> menus,
            Map<UUID, TenantMenuConfig> tenantConfigs) {

        return menus.stream()
            .filter(menu -> Boolean.TRUE.equals(getEffectiveShowInMobile(menu, tenantConfigs.get(menu.getId()))))
            .sorted(Comparator.comparing(m -> getEffectiveMobileSortOrder(m, tenantConfigs.get(m.getId()))))
            .map(menu -> {
                TenantMenuConfig config = tenantConfigs.get(menu.getId());
                return createUserMenuItemBuilder(menu, config)
                    .sortOrder(getEffectiveMobileSortOrder(menu, config))
                    .build();
            })
            .collect(Collectors.toList());
    }

    // ============================================
    // Admin Menu Operations
    // ============================================

    @Override
    @Transactional(readOnly = true)
    public List<MenuItemResponse> getAllMenusTree() {
        List<MenuItem> topLevel = menuItemRepository.findAllTreeWithPermissions();
        return topLevel.stream()
            .map(MenuItemResponse::from)
            .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<MenuItemResponse> getAllMenusFlat() {
        List<MenuItem> all = menuItemRepository.findAllOrdered();
        return all.stream()
            .map(m -> MenuItemResponse.from(m, false))
            .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public MenuItemResponse getMenuById(UUID id) {
        MenuItem menu = getMenuEntityById(id);
        return MenuItemResponse.from(menu);
    }

    @Override
    @Transactional(readOnly = true)
    public MenuItemResponse getMenuByCode(String code) {
        MenuItem menu = menuItemRepository.findByCode(code)
            .orElseThrow(() -> new NotFoundException("MDM_MENU_001", "메뉴를 찾을 수 없습니다: " + code));
        return MenuItemResponse.from(menu);
    }

    @Override
    @Transactional
    public MenuItemResponse createMenu(CreateMenuItemRequest request) {
        // Validate unique code
        if (menuItemRepository.existsByCode(request.getCode())) {
            throw new ValidationException("MDM_MENU_002", "이미 존재하는 메뉴 코드입니다: " + request.getCode());
        }

        MenuItem menu = MenuItem.builder()
            .code(request.getCode())
            .name(request.getName())
            .nameEn(request.getNameEn())
            .path(request.getPath())
            .icon(request.getIcon())
            .menuType(request.getMenuType())
            .externalUrl(request.getExternalUrl())
            .sortOrder(request.getSortOrder())
            .featureCode(request.getFeatureCode())
            .isSystem(request.getIsSystem())
            .isActive(true)
            .showInNav(request.getShowInNav())
            .showInMobile(request.getShowInMobile())
            .mobileSortOrder(request.getMobileSortOrder())
            .build();

        // Set parent if provided
        if (request.getParentId() != null) {
            MenuItem parent = getMenuEntityById(request.getParentId());
            menu.setParent(parent);
            menu.setLevel(parent.getLevel() + 1);
        }

        // Add permissions
        if (request.getRoles() != null) {
            for (String role : request.getRoles()) {
                menu.addPermission(MenuPermission.ofRole(role));
            }
        }
        if (request.getPermissions() != null) {
            for (String permission : request.getPermissions()) {
                menu.addPermission(MenuPermission.ofPermission(permission));
            }
        }

        menu = menuItemRepository.save(menu);
        menuCacheService.invalidateMenuCache();

        log.info("Created menu: {} ({})", menu.getCode(), menu.getId());
        return MenuItemResponse.from(menu);
    }

    @Override
    @Transactional
    public MenuItemResponse updateMenu(UUID id, UpdateMenuItemRequest request) {
        MenuItem menu = getMenuEntityById(id);

        if (request.getName() != null) {
            menu.setName(request.getName());
        }
        if (request.getNameEn() != null) {
            menu.setNameEn(request.getNameEn());
        }
        if (request.getPath() != null) {
            menu.setPath(request.getPath());
        }
        if (request.getIcon() != null) {
            menu.setIcon(request.getIcon());
        }
        if (request.getMenuType() != null) {
            menu.setMenuType(request.getMenuType());
        }
        if (request.getExternalUrl() != null) {
            menu.setExternalUrl(request.getExternalUrl());
        }
        if (request.getSortOrder() != null) {
            menu.setSortOrder(request.getSortOrder());
        }
        if (request.getFeatureCode() != null) {
            menu.setFeatureCode(request.getFeatureCode());
        }
        if (request.getIsActive() != null) {
            menu.setIsActive(request.getIsActive());
        }
        if (request.getShowInNav() != null) {
            menu.setShowInNav(request.getShowInNav());
        }
        if (request.getShowInMobile() != null) {
            menu.setShowInMobile(request.getShowInMobile());
        }
        if (request.getMobileSortOrder() != null) {
            menu.setMobileSortOrder(request.getMobileSortOrder());
        }

        // Update parent if provided
        if (request.getParentId() != null) {
            if (request.getParentId().equals(menu.getId())) {
                throw new ValidationException("MDM_MENU_003", "메뉴의 부모를 자기 자신으로 설정할 수 없습니다");
            }
            MenuItem parent = getMenuEntityById(request.getParentId());
            menu.setParent(parent);
            menu.setLevel(parent.getLevel() + 1);
        }

        // Update permissions if provided
        if (request.getRoles() != null || request.getPermissions() != null) {
            menu.getPermissions().clear();

            if (request.getRoles() != null) {
                for (String role : request.getRoles()) {
                    menu.addPermission(MenuPermission.ofRole(role));
                }
            }
            if (request.getPermissions() != null) {
                for (String permission : request.getPermissions()) {
                    menu.addPermission(MenuPermission.ofPermission(permission));
                }
            }
        }

        menu = menuItemRepository.save(menu);
        menuCacheService.invalidateMenuCache();

        log.info("Updated menu: {} ({})", menu.getCode(), menu.getId());
        return MenuItemResponse.from(menu);
    }

    @Override
    @Transactional
    public void deleteMenu(UUID id) {
        MenuItem menu = getMenuEntityById(id);

        if (Boolean.TRUE.equals(menu.getIsSystem())) {
            throw new ValidationException("MDM_MENU_004", "시스템 메뉴는 삭제할 수 없습니다");
        }

        // Soft delete
        menu.setIsActive(false);
        menuItemRepository.save(menu);
        menuCacheService.invalidateMenuCache();

        log.info("Deleted menu: {} ({})", menu.getCode(), menu.getId());
    }

    @Override
    @Transactional
    public void reorderMenus(MenuReorderRequest request) {
        // Collect all IDs to fetch
        Set<UUID> allIds = new HashSet<>();
        for (MenuReorderRequest.MenuOrderItem item : request.getItems()) {
            allIds.add(item.getId());
            if (item.getParentId() != null) {
                allIds.add(item.getParentId());
            }
        }

        // Batch fetch all involved menus
        Map<UUID, MenuItem> menuMap = menuItemRepository.findAllById(allIds).stream()
            .collect(Collectors.toMap(MenuItem::getId, m -> m));

        List<MenuItem> menusToSave = new ArrayList<>();

        for (MenuReorderRequest.MenuOrderItem item : request.getItems()) {
            MenuItem menu = menuMap.get(item.getId());
            if (menu == null) {
                throw new NotFoundException("MDM_MENU_001", "메뉴를 찾을 수 없습니다: " + item.getId());
            }

            menu.setSortOrder(item.getSortOrder());

            if (item.getParentId() != null) {
                MenuItem parent = menuMap.get(item.getParentId());
                if (parent == null) {
                    throw new NotFoundException("MDM_MENU_001", "부모 메뉴를 찾을 수 없습니다: " + item.getParentId());
                }
                menu.setParent(parent);
                menu.setLevel(parent.getLevel() + 1);
            }

            menusToSave.add(menu);
        }

        menuItemRepository.saveAll(menusToSave);
        menuCacheService.invalidateMenuCache();

        log.info("Reordered {} menus", request.getItems().size());
    }

    // ============================================
    // Tenant Configuration Operations
    // ============================================

    @Override
    @Transactional(readOnly = true)
    public TenantMenuConfigResponse getTenantMenuConfig(UUID tenantId, UUID menuId) {
        return tenantMenuConfigRepository.findByTenantIdAndMenuItemId(tenantId, menuId)
            .map(TenantMenuConfigResponse::from)
            .orElse(null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TenantMenuConfigResponse> getTenantMenuConfigs(UUID tenantId) {
        return tenantMenuConfigRepository.findByTenantId(tenantId).stream()
            .map(TenantMenuConfigResponse::from)
            .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public TenantMenuConfigResponse updateTenantMenuConfig(UUID tenantId, UUID menuId, UpdateTenantMenuConfigRequest request) {
        MenuItem menu = getMenuEntityById(menuId);

        TenantMenuConfig config = tenantMenuConfigRepository
            .findByTenantIdAndMenuItemId(tenantId, menuId)
            .orElseGet(() -> TenantMenuConfig.builder()
                .tenantId(tenantId)
                .menuItem(menu)
                .build());

        if (request.getIsEnabled() != null) {
            config.setIsEnabled(request.getIsEnabled());
        }
        if (request.getCustomName() != null) {
            config.setCustomName(request.getCustomName().isBlank() ? null : request.getCustomName());
        }
        if (request.getCustomSortOrder() != null) {
            config.setCustomSortOrder(request.getCustomSortOrder());
        }
        if (request.getShowInMobile() != null) {
            config.setShowInMobile(request.getShowInMobile());
        }
        if (request.getMobileSortOrder() != null) {
            config.setMobileSortOrder(request.getMobileSortOrder());
        }

        config = tenantMenuConfigRepository.save(config);
        menuCacheService.invalidateTenantMenuCache(tenantId);

        log.info("Updated tenant menu config: tenant={}, menu={}", tenantId, menuId);
        return TenantMenuConfigResponse.from(config);
    }

    @Override
    @Transactional
    public void resetTenantMenuConfig(UUID tenantId, UUID menuId) {
        tenantMenuConfigRepository.deleteByTenantIdAndMenuItemId(tenantId, menuId);
        menuCacheService.invalidateTenantMenuCache(tenantId);

        log.info("Reset tenant menu config: tenant={}, menu={}", tenantId, menuId);
    }

    @Override
    @Transactional
    public void resetAllTenantMenuConfigs(UUID tenantId) {
        tenantMenuConfigRepository.deleteByTenantId(tenantId);
        menuCacheService.invalidateTenantMenuCache(tenantId);

        log.info("Reset all tenant menu configs: tenant={}", tenantId);
    }

    // ============================================
    // Tenant Custom Menu Operations
    // ============================================

    @Override
    @Transactional
    public MenuItemResponse createTenantMenu(UUID tenantId, CreateMenuItemRequest request) {
        // Validate unique code
        if (menuItemRepository.existsByCode(request.getCode())) {
            throw new ValidationException("MDM_MENU_002", "이미 존재하는 메뉴 코드입니다: " + request.getCode());
        }

        MenuItem menu = MenuItem.builder()
            .code(request.getCode())
            .name(request.getName())
            .nameEn(request.getNameEn())
            .path(request.getPath())
            .icon(request.getIcon())
            .menuType(request.getMenuType() != null ? request.getMenuType() : MenuType.INTERNAL)
            .externalUrl(request.getExternalUrl())
            .sortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0)
            .featureCode(request.getFeatureCode())
            .isSystem(false) // 커스텀 메뉴는 항상 non-system
            .isActive(true)
            .showInNav(request.getShowInNav() != null ? request.getShowInNav() : true)
            .showInMobile(request.getShowInMobile() != null ? request.getShowInMobile() : false)
            .mobileSortOrder(request.getMobileSortOrder())
            .tenantId(tenantId)
            .build();

        // Set parent if provided
        if (request.getParentId() != null) {
            MenuItem parent = getMenuEntityById(request.getParentId());
            menu.setParent(parent);
            menu.setLevel(parent.getLevel() + 1);
        }

        // Add permissions
        if (request.getRoles() != null) {
            for (String role : request.getRoles()) {
                menu.addPermission(MenuPermission.ofRole(role));
            }
        }
        if (request.getPermissions() != null) {
            for (String permission : request.getPermissions()) {
                menu.addPermission(MenuPermission.ofPermission(permission));
            }
        }

        menu = menuItemRepository.save(menu);
        menuCacheService.invalidateMenuCache();

        log.info("Created tenant custom menu: {} ({}) for tenant {}", menu.getCode(), menu.getId(), tenantId);
        return MenuItemResponse.from(menu);
    }

    @Override
    @Transactional
    public MenuItemResponse updateTenantMenu(UUID tenantId, UUID menuId, UpdateMenuItemRequest request) {
        MenuItem menu = getMenuEntityById(menuId);

        // 시스템 메뉴 보호
        if (Boolean.TRUE.equals(menu.getIsSystem())) {
            throw new ValidationException("MDM_MENU_005", "시스템 메뉴는 테넌트에서 수정할 수 없습니다");
        }

        // 테넌트 소유권 체크
        if (menu.getTenantId() == null || !menu.getTenantId().equals(tenantId)) {
            throw new ValidationException("MDM_MENU_006", "이 테넌트의 메뉴가 아닙니다");
        }

        // 기존 updateMenu 로직 재사용
        return updateMenu(menuId, request);
    }

    @Override
    @Transactional
    public void deleteTenantMenu(UUID tenantId, UUID menuId) {
        MenuItem menu = getMenuEntityById(menuId);

        // 시스템 메뉴 보호
        if (Boolean.TRUE.equals(menu.getIsSystem())) {
            throw new ValidationException("MDM_MENU_005", "시스템 메뉴는 삭제할 수 없습니다");
        }

        // 테넌트 소유권 체크
        if (menu.getTenantId() == null || !menu.getTenantId().equals(tenantId)) {
            throw new ValidationException("MDM_MENU_006", "이 테넌트의 메뉴가 아닙니다");
        }

        menu.setIsActive(false);
        menuItemRepository.save(menu);
        menuCacheService.invalidateMenuCache();

        log.info("Deleted tenant custom menu: {} ({}) for tenant {}", menu.getCode(), menu.getId(), tenantId);
    }

    // ============================================
    // Internal Operations
    // ============================================

    private String getEffectiveName(MenuItem menu, TenantMenuConfig config) {
        return config != null && config.getCustomName() != null
            ? config.getCustomName() : menu.getName();
    }

    private Integer getEffectiveSortOrder(MenuItem menu, TenantMenuConfig config) {
        return config != null && config.getCustomSortOrder() != null
            ? config.getCustomSortOrder() : menu.getSortOrder();
    }

    private Integer getEffectiveMobileSortOrder(MenuItem menu, TenantMenuConfig config) {
        Integer mobileSortOrder = config != null && config.getMobileSortOrder() != null
            ? config.getMobileSortOrder() : menu.getMobileSortOrder();
        return mobileSortOrder != null ? mobileSortOrder : Integer.MAX_VALUE;
    }

    private Boolean getEffectiveShowInMobile(MenuItem menu, TenantMenuConfig config) {
        return config != null && config.getShowInMobile() != null
            ? config.getShowInMobile() : menu.getShowInMobile();
    }

    private UserMenuResponse.UserMenuItem.UserMenuItemBuilder createUserMenuItemBuilder(
            MenuItem menu, TenantMenuConfig config) {
        return UserMenuResponse.UserMenuItem.builder()
            .code(menu.getCode())
            .name(getEffectiveName(menu, config))
            .nameEn(menu.getNameEn())
            .path(menu.getPath())
            .icon(menu.getIcon())
            .externalUrl(menu.getExternalUrl())
            .isExternal(MenuType.EXTERNAL.equals(menu.getMenuType()))
            .groupName(menu.getGroupName());
    }

    @Override
    @Transactional(readOnly = true)
    public MenuItem getMenuEntityById(UUID id) {
        return menuItemRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("MDM_MENU_001", "메뉴를 찾을 수 없습니다: " + id));
    }
}
