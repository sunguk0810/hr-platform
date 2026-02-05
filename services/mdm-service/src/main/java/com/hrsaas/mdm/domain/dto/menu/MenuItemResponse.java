package com.hrsaas.mdm.domain.dto.menu;

import com.hrsaas.mdm.domain.entity.menu.MenuItem;
import com.hrsaas.mdm.domain.entity.menu.MenuPermission;
import com.hrsaas.mdm.domain.entity.menu.MenuType;
import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Response DTO for menu item.
 */
@Data
@Builder
public class MenuItemResponse {

    private UUID id;
    private String code;
    private String name;
    private String nameEn;
    private String path;
    private String icon;
    private MenuType menuType;
    private String externalUrl;
    private Integer level;
    private Integer sortOrder;
    private String featureCode;
    private Boolean isSystem;
    private Boolean isActive;
    private Boolean showInNav;
    private Boolean showInMobile;
    private Integer mobileSortOrder;
    private List<String> roles;
    private List<String> permissions;
    private List<MenuItemResponse> children;

    /**
     * Convert entity to response DTO.
     */
    public static MenuItemResponse from(MenuItem entity) {
        return from(entity, true);
    }

    /**
     * Convert entity to response DTO with optional children.
     */
    public static MenuItemResponse from(MenuItem entity, boolean includeChildren) {
        if (entity == null) {
            return null;
        }

        List<String> roles = entity.getPermissions().stream()
            .filter(MenuPermission::isRole)
            .map(MenuPermission::getPermissionValue)
            .collect(Collectors.toList());

        List<String> permissions = entity.getPermissions().stream()
            .filter(MenuPermission::isPermission)
            .map(MenuPermission::getPermissionValue)
            .collect(Collectors.toList());

        List<MenuItemResponse> children = null;
        if (includeChildren && entity.getChildren() != null && !entity.getChildren().isEmpty()) {
            children = entity.getChildren().stream()
                .filter(MenuItem::getIsActive)
                .map(child -> MenuItemResponse.from(child, true))
                .collect(Collectors.toList());
        }

        return MenuItemResponse.builder()
            .id(entity.getId())
            .code(entity.getCode())
            .name(entity.getName())
            .nameEn(entity.getNameEn())
            .path(entity.getPath())
            .icon(entity.getIcon())
            .menuType(entity.getMenuType())
            .externalUrl(entity.getExternalUrl())
            .level(entity.getLevel())
            .sortOrder(entity.getSortOrder())
            .featureCode(entity.getFeatureCode())
            .isSystem(entity.getIsSystem())
            .isActive(entity.getIsActive())
            .showInNav(entity.getShowInNav())
            .showInMobile(entity.getShowInMobile())
            .mobileSortOrder(entity.getMobileSortOrder())
            .roles(roles)
            .permissions(permissions)
            .children(children)
            .build();
    }
}
