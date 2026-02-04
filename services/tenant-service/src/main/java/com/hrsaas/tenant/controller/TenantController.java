package com.hrsaas.tenant.controller;

import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.common.response.PageResponse;
import com.hrsaas.tenant.domain.dto.request.CreateTenantRequest;
import com.hrsaas.tenant.domain.dto.request.UpdateTenantRequest;
import com.hrsaas.tenant.domain.dto.response.TenantResponse;
import com.hrsaas.tenant.service.TenantService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tenants")
@RequiredArgsConstructor
@Tag(name = "Tenant", description = "테넌트 관리 API")
public class TenantController {

    private final TenantService tenantService;

    @PostMapping
    @Operation(summary = "테넌트 생성")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<TenantResponse>> create(
            @Valid @RequestBody CreateTenantRequest request) {
        TenantResponse response = tenantService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.created(response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "테넌트 상세 조회")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @permissionChecker.isTenantAdmin()")
    public ResponseEntity<ApiResponse<TenantResponse>> getById(@PathVariable UUID id) {
        TenantResponse response = tenantService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/code/{code}")
    @Operation(summary = "테넌트 코드로 조회")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @permissionChecker.isTenantAdmin()")
    public ResponseEntity<ApiResponse<TenantResponse>> getByCode(@PathVariable String code) {
        TenantResponse response = tenantService.getByCode(code);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @Operation(summary = "테넌트 목록 조회")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<PageResponse<TenantResponse>>> getAll(
            @PageableDefault(size = 20) Pageable pageable) {
        PageResponse<TenantResponse> response = tenantService.getAll(pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "테넌트 수정")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<TenantResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateTenantRequest request) {
        TenantResponse response = tenantService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{id}/activate")
    @Operation(summary = "테넌트 활성화")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<TenantResponse>> activate(@PathVariable UUID id) {
        TenantResponse response = tenantService.activate(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{id}/suspend")
    @Operation(summary = "테넌트 일시 중지")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<TenantResponse>> suspend(@PathVariable UUID id) {
        TenantResponse response = tenantService.suspend(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "테넌트 삭제 (종료)")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        tenantService.terminate(id);
        return ResponseEntity.ok(ApiResponse.success(null, "테넌트가 종료되었습니다."));
    }
}
