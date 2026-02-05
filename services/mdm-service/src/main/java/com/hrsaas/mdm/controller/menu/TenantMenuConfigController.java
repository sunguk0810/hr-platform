package com.hrsaas.mdm.controller.menu;

import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.mdm.domain.dto.menu.TenantMenuConfigResponse;
import com.hrsaas.mdm.domain.dto.menu.UpdateTenantMenuConfigRequest;
import com.hrsaas.mdm.service.menu.MenuService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST API controller for tenant-specific menu configuration.
 * Allows tenants to customize menu visibility, names, and order.
 */
@RestController
@RequestMapping("/api/v1/tenants/{tenantId}/menus")
@RequiredArgsConstructor
@Tag(name = "Tenant Menu Config", description = "테넌트별 메뉴 설정 API")
@PreAuthorize("@permissionChecker.isTenantAdmin()")
public class TenantMenuConfigController {

    private final MenuService menuService;

    /**
     * Get all menu configurations for a tenant.
     */
    @GetMapping("/config")
    @Operation(summary = "테넌트 메뉴 설정 조회", description = "테넌트의 모든 메뉴 설정을 조회합니다.")
    public ApiResponse<List<TenantMenuConfigResponse>> getTenantMenuConfigs(
            @Parameter(description = "테넌트 ID") @PathVariable UUID tenantId) {
        return ApiResponse.success(menuService.getTenantMenuConfigs(tenantId));
    }

    /**
     * Get configuration for a specific menu and tenant.
     */
    @GetMapping("/{menuId}/config")
    @Operation(summary = "특정 메뉴 설정 조회", description = "특정 메뉴의 테넌트 설정을 조회합니다.")
    public ApiResponse<TenantMenuConfigResponse> getTenantMenuConfig(
            @Parameter(description = "테넌트 ID") @PathVariable UUID tenantId,
            @Parameter(description = "메뉴 ID") @PathVariable UUID menuId) {
        return ApiResponse.success(menuService.getTenantMenuConfig(tenantId, menuId));
    }

    /**
     * Update tenant-specific menu configuration.
     */
    @PutMapping("/{menuId}/config")
    @Operation(
        summary = "테넌트 메뉴 설정 수정",
        description = "테넌트별 메뉴 설정을 수정합니다. 활성화/비활성화, 이름 변경, 순서 변경 등이 가능합니다."
    )
    public ApiResponse<TenantMenuConfigResponse> updateTenantMenuConfig(
            @Parameter(description = "테넌트 ID") @PathVariable UUID tenantId,
            @Parameter(description = "메뉴 ID") @PathVariable UUID menuId,
            @Valid @RequestBody UpdateTenantMenuConfigRequest request) {
        return ApiResponse.success(menuService.updateTenantMenuConfig(tenantId, menuId, request));
    }

    /**
     * Reset a specific menu configuration to defaults.
     */
    @DeleteMapping("/{menuId}/config")
    @Operation(summary = "메뉴 설정 초기화", description = "특정 메뉴의 테넌트 설정을 기본값으로 초기화합니다.")
    public ApiResponse<Void> resetTenantMenuConfig(
            @Parameter(description = "테넌트 ID") @PathVariable UUID tenantId,
            @Parameter(description = "메뉴 ID") @PathVariable UUID menuId) {
        menuService.resetTenantMenuConfig(tenantId, menuId);
        return ApiResponse.success(null);
    }

    /**
     * Reset all menu configurations for a tenant.
     */
    @DeleteMapping("/config")
    @Operation(summary = "전체 메뉴 설정 초기화", description = "테넌트의 모든 메뉴 설정을 기본값으로 초기화합니다.")
    public ApiResponse<Void> resetAllTenantMenuConfigs(
            @Parameter(description = "테넌트 ID") @PathVariable UUID tenantId) {
        menuService.resetAllTenantMenuConfigs(tenantId);
        return ApiResponse.success(null);
    }
}
