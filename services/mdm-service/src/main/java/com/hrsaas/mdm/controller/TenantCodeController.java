package com.hrsaas.mdm.controller;

import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.mdm.domain.dto.request.UpdateTenantCodeRequest;
import com.hrsaas.mdm.domain.dto.response.TenantCodeResponse;
import com.hrsaas.mdm.service.TenantCodeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/mdm/tenant-codes")
@RequiredArgsConstructor
@Tag(name = "Tenant Code", description = "테넌트별 코드 커스터마이징 API")
public class TenantCodeController {

    private final TenantCodeService tenantCodeService;

    @GetMapping("/{codeId}")
    @Operation(summary = "테넌트 코드 설정 조회")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<TenantCodeResponse>> getByCodeId(
            @PathVariable UUID codeId) {
        TenantCodeResponse response = tenantCodeService.getByCodeId(codeId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @Operation(summary = "그룹별 테넌트 코드 목록 조회")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<TenantCodeResponse>>> getByGroupCode(
            @RequestParam String groupCode) {
        List<TenantCodeResponse> response = tenantCodeService.getByGroupCode(groupCode);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{codeId}")
    @Operation(summary = "테넌트 코드 설정 수정")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<TenantCodeResponse>> update(
            @PathVariable UUID codeId,
            @Valid @RequestBody UpdateTenantCodeRequest request) {
        TenantCodeResponse response = tenantCodeService.update(codeId, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{codeId}/hide")
    @Operation(summary = "테넌트에서 코드 숨기기")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<TenantCodeResponse>> hide(
            @PathVariable UUID codeId) {
        TenantCodeResponse response = tenantCodeService.hide(codeId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{codeId}/show")
    @Operation(summary = "테넌트에서 코드 보이기")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<TenantCodeResponse>> show(
            @PathVariable UUID codeId) {
        TenantCodeResponse response = tenantCodeService.show(codeId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/{codeId}")
    @Operation(summary = "테넌트 코드 커스터마이징 초기화 (원본으로 복원)")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> resetToDefault(
            @PathVariable UUID codeId) {
        tenantCodeService.resetToDefault(codeId);
        return ResponseEntity.ok(ApiResponse.success(null, "코드 설정이 초기화되었습니다."));
    }
}
