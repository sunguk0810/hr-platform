package com.hrsaas.mdm.controller.menu;

import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.mdm.domain.dto.menu.CreateMenuItemRequest;
import com.hrsaas.mdm.domain.dto.menu.MenuItemResponse;
import com.hrsaas.mdm.domain.dto.menu.UpdateMenuItemRequest;
import com.hrsaas.mdm.service.menu.MenuService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * 테넌트 커스텀 메뉴 관리 API
 */
@RestController
@RequestMapping("/api/v1/tenants/{tenantId}/menus")
@RequiredArgsConstructor
@Tag(name = "Tenant Custom Menu", description = "테넌트 커스텀 메뉴 관리 API")
@PreAuthorize("@permissionChecker.isTenantAdmin()")
public class TenantCustomMenuController {

    private final MenuService menuService;

    @PostMapping
    @Operation(summary = "테넌트 커스텀 메뉴 생성")
    public ResponseEntity<ApiResponse<MenuItemResponse>> createTenantMenu(
            @PathVariable UUID tenantId,
            @Valid @RequestBody CreateMenuItemRequest request) {
        MenuItemResponse response = menuService.createTenantMenu(tenantId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.created(response));
    }

    @PutMapping("/{menuId}")
    @Operation(summary = "테넌트 커스텀 메뉴 수정")
    public ResponseEntity<ApiResponse<MenuItemResponse>> updateTenantMenu(
            @PathVariable UUID tenantId,
            @PathVariable UUID menuId,
            @Valid @RequestBody UpdateMenuItemRequest request) {
        MenuItemResponse response = menuService.updateTenantMenu(tenantId, menuId, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/{menuId}")
    @Operation(summary = "테넌트 커스텀 메뉴 삭제")
    public ResponseEntity<ApiResponse<Void>> deleteTenantMenu(
            @PathVariable UUID tenantId,
            @PathVariable UUID menuId) {
        menuService.deleteTenantMenu(tenantId, menuId);
        return ResponseEntity.ok(ApiResponse.success(null, "커스텀 메뉴가 삭제되었습니다."));
    }
}
