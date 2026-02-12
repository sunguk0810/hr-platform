package com.hrsaas.mdm.service.menu.impl;

import com.hrsaas.common.core.exception.NotFoundException;
import com.hrsaas.common.core.exception.ValidationException;
import com.hrsaas.common.tenant.TenantContext;
import com.hrsaas.mdm.domain.dto.menu.*;
import com.hrsaas.mdm.domain.entity.menu.*;
import com.hrsaas.mdm.repository.menu.MenuItemRepository;
import com.hrsaas.mdm.repository.menu.MenuPermissionRepository;
import com.hrsaas.mdm.repository.menu.TenantMenuConfigRepository;
import com.hrsaas.mdm.service.menu.MenuCacheService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MenuServiceImplTest {

    private static final UUID TENANT_ID = UUID.randomUUID();

    @Mock
    private MenuItemRepository menuItemRepository;

    @Mock
    private MenuPermissionRepository menuPermissionRepository;

    @Mock
    private TenantMenuConfigRepository tenantMenuConfigRepository;

    @Mock
    private MenuCacheService menuCacheService;

    @InjectMocks
    private MenuServiceImpl menuService;

    @BeforeEach
    void setUp() {
        TenantContext.setCurrentTenant(TENANT_ID);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    // ================================================================
    // getUserMenus - filters disabled menus
    // ================================================================

    @Test
    @DisplayName("getUserMenus - filters disabled menus")
    void getUserMenus_filtersDisabledMenus() {
        // given
        UUID enabledMenuId = UUID.randomUUID();
        UUID disabledMenuId = UUID.randomUUID();

        MenuItem enabledMenu = createMenuItem(enabledMenuId, "MENU_HR", "인사관리", "/hr", true);
        MenuItem disabledMenu = createMenuItem(disabledMenuId, "MENU_RECRUIT", "채용관리", "/recruit", true);

        when(menuCacheService.getAllMenusWithPermissions())
            .thenReturn(List.of(enabledMenu, disabledMenu));
        when(tenantMenuConfigRepository.findDisabledMenuIdsByTenantId(TENANT_ID))
            .thenReturn(List.of(disabledMenuId));
        when(tenantMenuConfigRepository.findByTenantId(TENANT_ID))
            .thenReturn(Collections.emptyList());

        Set<String> userRoles = Set.of("ROLE_HR_MANAGER");
        Set<String> userPermissions = Set.of("*:*");

        // when
        UserMenuResponse result = menuService.getUserMenus(TENANT_ID, userRoles, userPermissions);

        // then
        assertThat(result).isNotNull();
        assertThat(result.getSidebarMenus()).hasSize(1);
        assertThat(result.getSidebarMenus().get(0).getCode()).isEqualTo("MENU_HR");
    }

    // ================================================================
    // getUserMenus - filters by role
    // ================================================================

    @Test
    @DisplayName("getUserMenus - filters by role")
    void getUserMenus_filtersByRole() {
        // given
        UUID menuId = UUID.randomUUID();
        MenuItem menu = createMenuItem(menuId, "MENU_ADMIN", "관리자", "/admin", true);

        // This menu requires ADMIN role
        MenuPermission rolePermission = MenuPermission.ofRole("ADMIN");
        rolePermission.setMenuItem(menu);
        menu.getPermissions().add(rolePermission);

        when(menuCacheService.getAllMenusWithPermissions()).thenReturn(List.of(menu));
        when(tenantMenuConfigRepository.findDisabledMenuIdsByTenantId(TENANT_ID))
            .thenReturn(Collections.emptyList());
        when(tenantMenuConfigRepository.findByTenantId(TENANT_ID))
            .thenReturn(Collections.emptyList());

        // User has HR_MANAGER role, not ADMIN
        Set<String> userRoles = Set.of("ROLE_HR_MANAGER");
        Set<String> userPermissions = Collections.emptySet();

        // when
        UserMenuResponse result = menuService.getUserMenus(TENANT_ID, userRoles, userPermissions);

        // then
        assertThat(result).isNotNull();
        // The menu requires ROLE_ADMIN but user only has ROLE_HR_MANAGER, so it should be filtered out
        assertThat(result.getSidebarMenus()).isEmpty();
    }

    // ================================================================
    // createMenu
    // ================================================================

    @Test
    @DisplayName("createMenu - valid request creates menu")
    void createMenu_validRequest_createsMenu() {
        // given
        UUID menuId = UUID.randomUUID();
        CreateMenuItemRequest request = new CreateMenuItemRequest();
        request.setCode("MENU_NEW");
        request.setName("새 메뉴");
        request.setNameEn("New Menu");
        request.setPath("/new-menu");
        request.setIcon("star");
        request.setMenuType(MenuType.INTERNAL);
        request.setSortOrder(10);
        request.setIsSystem(false);
        request.setShowInNav(true);
        request.setShowInMobile(false);
        request.setRoles(List.of("HR_MANAGER"));
        request.setPermissions(List.of("menu:read"));

        MenuItem savedMenu = createMenuItem(menuId, "MENU_NEW", "새 메뉴", "/new-menu", true);

        when(menuItemRepository.existsByCode("MENU_NEW")).thenReturn(false);
        when(menuItemRepository.save(any(MenuItem.class))).thenReturn(savedMenu);

        // when
        MenuItemResponse result = menuService.createMenu(request);

        // then
        assertThat(result).isNotNull();
        assertThat(result.getCode()).isEqualTo("MENU_NEW");
        assertThat(result.getName()).isEqualTo("새 메뉴");
        verify(menuItemRepository).save(any(MenuItem.class));
        verify(menuCacheService).invalidateMenuCache();
    }

    @Test
    @DisplayName("createMenu - duplicate code throws ValidationException")
    void createMenu_duplicateCode_throwsValidation() {
        // given
        CreateMenuItemRequest request = new CreateMenuItemRequest();
        request.setCode("MENU_EXISTING");
        request.setName("기존 메뉴");

        when(menuItemRepository.existsByCode("MENU_EXISTING")).thenReturn(true);

        // when & then
        assertThatThrownBy(() -> menuService.createMenu(request))
            .isInstanceOf(ValidationException.class)
            .hasMessageContaining("이미 존재하는 메뉴 코드입니다");

        verify(menuItemRepository, never()).save(any());
    }

    // ================================================================
    // updateMenu
    // ================================================================

    @Test
    @DisplayName("updateMenu - valid request updates menu")
    void updateMenu_validRequest_updatesMenu() {
        // given
        UUID menuId = UUID.randomUUID();
        MenuItem existingMenu = createMenuItem(menuId, "MENU_HR", "인사관리", "/hr", true);

        UpdateMenuItemRequest request = new UpdateMenuItemRequest();
        request.setName("인사관리 (수정)");
        request.setPath("/hr-updated");

        when(menuItemRepository.findById(menuId)).thenReturn(Optional.of(existingMenu));
        when(menuItemRepository.save(any(MenuItem.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // when
        MenuItemResponse result = menuService.updateMenu(menuId, request);

        // then
        assertThat(result).isNotNull();
        assertThat(result.getName()).isEqualTo("인사관리 (수정)");
        assertThat(result.getPath()).isEqualTo("/hr-updated");
        verify(menuItemRepository).save(any(MenuItem.class));
        verify(menuCacheService).invalidateMenuCache();
    }

    // ================================================================
    // deleteMenu
    // ================================================================

    @Test
    @DisplayName("deleteMenu - non-system menu soft deletes")
    void deleteMenu_nonSystemMenu_softDeletes() {
        // given
        UUID menuId = UUID.randomUUID();
        MenuItem menu = createMenuItem(menuId, "MENU_CUSTOM", "커스텀 메뉴", "/custom", false);
        menu.setIsSystem(false);

        when(menuItemRepository.findById(menuId)).thenReturn(Optional.of(menu));
        when(menuItemRepository.save(any(MenuItem.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // when
        menuService.deleteMenu(menuId);

        // then
        assertThat(menu.getIsActive()).isFalse();
        verify(menuItemRepository).save(menu);
        verify(menuCacheService).invalidateMenuCache();
    }

    @Test
    @DisplayName("deleteMenu - system menu throws ValidationException")
    void deleteMenu_systemMenu_throwsValidation() {
        // given
        UUID menuId = UUID.randomUUID();
        MenuItem menu = createMenuItem(menuId, "MENU_SYSTEM", "시스템 메뉴", "/system", true);
        menu.setIsSystem(true);

        when(menuItemRepository.findById(menuId)).thenReturn(Optional.of(menu));

        // when & then
        assertThatThrownBy(() -> menuService.deleteMenu(menuId))
            .isInstanceOf(ValidationException.class)
            .hasMessageContaining("시스템 메뉴는 삭제할 수 없습니다");

        verify(menuItemRepository, never()).save(any());
    }

    // ================================================================
    // reorderMenus
    // ================================================================

    @Test
    @DisplayName("reorderMenus - success updates sort orders")
    void reorderMenus_success_updatesSortOrders() {
        // given
        UUID menu1Id = UUID.randomUUID();
        UUID menu2Id = UUID.randomUUID();

        MenuItem menu1 = createMenuItem(menu1Id, "MENU_A", "메뉴 A", "/a", true);
        MenuItem menu2 = createMenuItem(menu2Id, "MENU_B", "메뉴 B", "/b", true);

        MenuReorderRequest request = new MenuReorderRequest();
        MenuReorderRequest.MenuOrderItem item1 = new MenuReorderRequest.MenuOrderItem();
        item1.setId(menu1Id);
        item1.setSortOrder(2);

        MenuReorderRequest.MenuOrderItem item2 = new MenuReorderRequest.MenuOrderItem();
        item2.setId(menu2Id);
        item2.setSortOrder(1);

        request.setItems(List.of(item1, item2));

        when(menuItemRepository.findAllById(any())).thenReturn(List.of(menu1, menu2));
        when(menuItemRepository.saveAll(any())).thenReturn(List.of(menu1, menu2));

        // when
        menuService.reorderMenus(request);

        // then
        assertThat(menu1.getSortOrder()).isEqualTo(2);
        assertThat(menu2.getSortOrder()).isEqualTo(1);
        verify(menuItemRepository).saveAll(any());
        verify(menuCacheService).invalidateMenuCache();
    }

    @Test
    @DisplayName("reorderMenus - missing menu throws NotFoundException")
    void reorderMenus_missingMenu_throwsNotFound() {
        // given
        UUID menuId = UUID.randomUUID();

        MenuReorderRequest request = new MenuReorderRequest();
        MenuReorderRequest.MenuOrderItem item = new MenuReorderRequest.MenuOrderItem();
        item.setId(menuId);
        item.setSortOrder(1);
        request.setItems(List.of(item));

        when(menuItemRepository.findAllById(any())).thenReturn(Collections.emptyList());

        // when & then
        assertThatThrownBy(() -> menuService.reorderMenus(request))
            .isInstanceOf(NotFoundException.class)
            .hasMessageContaining("메뉴를 찾을 수 없습니다");

        verify(menuItemRepository, never()).saveAll(any());
    }

    // ================================================================
    // Helper methods
    // ================================================================

    private MenuItem createMenuItem(UUID id, String code, String name, String path, boolean isActive) {
        MenuItem menuItem = MenuItem.builder()
            .code(code)
            .name(name)
            .path(path)
            .menuType(MenuType.INTERNAL)
            .level(1)
            .sortOrder(0)
            .isSystem(true)
            .isActive(isActive)
            .showInNav(true)
            .showInMobile(false)
            .permissions(new LinkedHashSet<>())
            .children(new LinkedHashSet<>())
            .build();
        setMenuItemId(menuItem, id);
        return menuItem;
    }

    private void setMenuItemId(MenuItem menuItem, UUID id) {
        try {
            java.lang.reflect.Field idField = MenuItem.class.getDeclaredField("id");
            idField.setAccessible(true);
            idField.set(menuItem, id);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
