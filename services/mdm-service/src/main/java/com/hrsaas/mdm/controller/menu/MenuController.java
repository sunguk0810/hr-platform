package com.hrsaas.mdm.controller.menu;

import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.mdm.domain.dto.menu.*;
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
 * REST API controller for menu administration.
 * Requires TENANT_ADMIN or higher role.
 */
@RestController
@RequestMapping("/api/v1/admin/menus")
@RequiredArgsConstructor
@Tag(name = "Menu Admin", description = "메뉴 관리 API")
@PreAuthorize("@permissionChecker.isTenantAdmin()")
public class MenuController {

    private final MenuService menuService;

    // ============================================
    // Menu CRUD Operations
    // ============================================

    /**
     * Get all menus as a tree structure.
     */
    @GetMapping
    @Operation(summary = "전체 메뉴 트리 조회", description = "계층 구조로 전체 메뉴를 조회합니다.")
    public ApiResponse<List<MenuItemResponse>> getAllMenusTree() {
        return ApiResponse.success(menuService.getAllMenusTree());
    }

    /**
     * Get all menus as a flat list.
     */
    @GetMapping("/flat")
    @Operation(summary = "전체 메뉴 목록 조회", description = "평면 목록으로 전체 메뉴를 조회합니다.")
    public ApiResponse<List<MenuItemResponse>> getAllMenusFlat() {
        return ApiResponse.success(menuService.getAllMenusFlat());
    }

    /**
     * Get a specific menu by ID.
     */
    @GetMapping("/{id}")
    @Operation(summary = "메뉴 상세 조회", description = "특정 메뉴의 상세 정보를 조회합니다.")
    public ApiResponse<MenuItemResponse> getMenuById(
            @Parameter(description = "메뉴 ID") @PathVariable UUID id) {
        return ApiResponse.success(menuService.getMenuById(id));
    }

    /**
     * Get a specific menu by code.
     */
    @GetMapping("/code/{code}")
    @Operation(summary = "코드로 메뉴 조회", description = "코드로 메뉴를 조회합니다.")
    public ApiResponse<MenuItemResponse> getMenuByCode(
            @Parameter(description = "메뉴 코드") @PathVariable String code) {
        return ApiResponse.success(menuService.getMenuByCode(code));
    }

    /**
     * Create a new menu item.
     */
    @PostMapping
    @Operation(summary = "메뉴 생성", description = "새로운 메뉴를 생성합니다.")
    @PreAuthorize("@permissionChecker.isSuperAdmin()")
    public ApiResponse<MenuItemResponse> createMenu(
            @Valid @RequestBody CreateMenuItemRequest request) {
        return ApiResponse.success(menuService.createMenu(request));
    }

    /**
     * Update an existing menu item.
     */
    @PutMapping("/{id}")
    @Operation(summary = "메뉴 수정", description = "기존 메뉴를 수정합니다.")
    @PreAuthorize("@permissionChecker.isSuperAdmin()")
    public ApiResponse<MenuItemResponse> updateMenu(
            @Parameter(description = "메뉴 ID") @PathVariable UUID id,
            @Valid @RequestBody UpdateMenuItemRequest request) {
        return ApiResponse.success(menuService.updateMenu(id, request));
    }

    /**
     * Delete a menu item (soft delete).
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "메뉴 삭제", description = "메뉴를 삭제합니다. 시스템 메뉴는 삭제할 수 없습니다.")
    @PreAuthorize("@permissionChecker.isSuperAdmin()")
    public ApiResponse<Void> deleteMenu(
            @Parameter(description = "메뉴 ID") @PathVariable UUID id) {
        menuService.deleteMenu(id);
        return ApiResponse.success(null);
    }

    /**
     * Reorder menu items.
     */
    @PatchMapping("/reorder")
    @Operation(summary = "메뉴 순서 변경", description = "여러 메뉴의 순서를 일괄 변경합니다.")
    @PreAuthorize("@permissionChecker.isSuperAdmin()")
    public ApiResponse<Void> reorderMenus(
            @Valid @RequestBody MenuReorderRequest request) {
        menuService.reorderMenus(request);
        return ApiResponse.success(null);
    }
}
