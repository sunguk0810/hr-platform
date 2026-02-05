package com.hrsaas.mdm.domain.dto.menu;

import lombok.Builder;
import lombok.Data;

import java.util.List;

/**
 * Response DTO for user's accessible menus.
 * Includes both sidebar navigation and mobile bottom tab menus.
 */
@Data
@Builder
public class UserMenuResponse {

    /**
     * Menus for sidebar navigation.
     */
    private List<UserMenuItem> sidebarMenus;

    /**
     * Menus for mobile bottom tab bar.
     */
    private List<UserMenuItem> mobileMenus;

    /**
     * Individual menu item in user's menu list.
     */
    @Data
    @Builder
    public static class UserMenuItem {
        private String code;
        private String name;
        private String nameEn;
        private String path;
        private String icon;
        private String externalUrl;
        private Boolean isExternal;
        private Integer sortOrder;
        private List<UserMenuItem> children;
    }
}
