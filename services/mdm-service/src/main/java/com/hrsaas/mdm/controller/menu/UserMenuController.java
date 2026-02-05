package com.hrsaas.mdm.controller.menu;

import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.common.security.SecurityContextHolder;
import com.hrsaas.mdm.domain.dto.menu.UserMenuResponse;
import com.hrsaas.mdm.service.menu.MenuService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Set;
import java.util.UUID;

/**
 * REST API controller for user menu operations.
 * Returns menus accessible by the authenticated user.
 */
@RestController
@RequestMapping("/api/v1/menus")
@RequiredArgsConstructor
@Tag(name = "User Menu", description = "사용자 메뉴 조회 API")
public class UserMenuController {

    private final MenuService menuService;

    /**
     * Get menus accessible by the current user.
     * Returns both sidebar navigation menus and mobile bottom tab menus.
     */
    @GetMapping("/me")
    @Operation(
        summary = "내 메뉴 조회",
        description = "현재 사용자가 접근 가능한 메뉴 목록을 조회합니다. 역할, 권한, 테넌트 설정에 따라 필터링됩니다."
    )
    public ApiResponse<UserMenuResponse> getMyMenus() {
        UUID tenantId = SecurityContextHolder.getCurrentTenantId();
        Set<String> roles = SecurityContextHolder.getCurrentRoles();
        Set<String> permissions = SecurityContextHolder.getCurrentPermissions();

        UserMenuResponse response = menuService.getUserMenus(tenantId, roles, permissions);
        return ApiResponse.success(response);
    }
}
