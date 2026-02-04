package com.hrsaas.tenant.controller;

import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.tenant.domain.dto.request.UpdateTenantFeatureRequest;
import com.hrsaas.tenant.domain.dto.request.UpdateTenantPolicyRequest;
import com.hrsaas.tenant.domain.dto.response.TenantFeatureResponse;
import com.hrsaas.tenant.domain.dto.response.TenantPolicyResponse;
import com.hrsaas.tenant.domain.entity.PolicyType;
import com.hrsaas.tenant.service.TenantFeatureService;
import com.hrsaas.tenant.service.TenantPolicyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tenants/{tenantId}")
@RequiredArgsConstructor
@Tag(name = "Tenant Policy & Feature", description = "테넌트 정책 및 기능 관리 API")
public class TenantPolicyController {

    private final TenantPolicyService tenantPolicyService;
    private final TenantFeatureService tenantFeatureService;

    // Policy APIs
    @GetMapping("/policies")
    @Operation(summary = "테넌트 정책 목록 조회")
    public ResponseEntity<ApiResponse<List<TenantPolicyResponse>>> getAllPolicies(
            @PathVariable UUID tenantId,
            @RequestParam(required = false, defaultValue = "false") boolean activeOnly) {
        List<TenantPolicyResponse> response = activeOnly
            ? tenantPolicyService.getActiveByTenantId(tenantId)
            : tenantPolicyService.getAllByTenantId(tenantId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/policies/{policyType}")
    @Operation(summary = "테넌트 정책 상세 조회")
    public ResponseEntity<ApiResponse<TenantPolicyResponse>> getPolicy(
            @PathVariable UUID tenantId,
            @PathVariable PolicyType policyType) {
        TenantPolicyResponse response = tenantPolicyService.getByTenantIdAndPolicyType(tenantId, policyType);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/policies/{policyType}")
    @Operation(summary = "테넌트 정책 저장/수정")
    public ResponseEntity<ApiResponse<TenantPolicyResponse>> saveOrUpdatePolicy(
            @PathVariable UUID tenantId,
            @PathVariable PolicyType policyType,
            @Valid @RequestBody UpdateTenantPolicyRequest request) {
        TenantPolicyResponse response = tenantPolicyService.saveOrUpdate(tenantId, policyType, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/policies/{policyType}")
    @Operation(summary = "테넌트 정책 삭제")
    public ResponseEntity<ApiResponse<Void>> deletePolicy(
            @PathVariable UUID tenantId,
            @PathVariable PolicyType policyType) {
        tenantPolicyService.delete(tenantId, policyType);
        return ResponseEntity.ok(ApiResponse.success(null, "정책이 삭제되었습니다."));
    }

    // Feature APIs
    @GetMapping("/features")
    @Operation(summary = "테넌트 기능 목록 조회")
    public ResponseEntity<ApiResponse<List<TenantFeatureResponse>>> getAllFeatures(
            @PathVariable UUID tenantId,
            @RequestParam(required = false, defaultValue = "false") boolean enabledOnly) {
        List<TenantFeatureResponse> response = enabledOnly
            ? tenantFeatureService.getEnabledByTenantId(tenantId)
            : tenantFeatureService.getAllByTenantId(tenantId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/features/{featureCode}")
    @Operation(summary = "테넌트 기능 상세 조회")
    public ResponseEntity<ApiResponse<TenantFeatureResponse>> getFeature(
            @PathVariable UUID tenantId,
            @PathVariable String featureCode) {
        TenantFeatureResponse response = tenantFeatureService.getByTenantIdAndFeatureCode(tenantId, featureCode);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping("/features/{featureCode}")
    @Operation(summary = "테넌트 기능 활성화/비활성화")
    public ResponseEntity<ApiResponse<TenantFeatureResponse>> updateFeature(
            @PathVariable UUID tenantId,
            @PathVariable String featureCode,
            @Valid @RequestBody UpdateTenantFeatureRequest request) {
        TenantFeatureResponse response = tenantFeatureService.update(tenantId, featureCode, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/features/{featureCode}/enabled")
    @Operation(summary = "테넌트 기능 활성화 여부 확인")
    public ResponseEntity<ApiResponse<Boolean>> isFeatureEnabled(
            @PathVariable UUID tenantId,
            @PathVariable String featureCode) {
        boolean enabled = tenantFeatureService.isFeatureEnabled(tenantId, featureCode);
        return ResponseEntity.ok(ApiResponse.success(enabled));
    }
}
