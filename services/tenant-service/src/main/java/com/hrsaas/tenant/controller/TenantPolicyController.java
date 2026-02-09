package com.hrsaas.tenant.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.tenant.domain.dto.request.ToggleFeatureRequest;
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
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/tenants/{tenantId}")
@RequiredArgsConstructor
@Tag(name = "Tenant Policy & Feature", description = "테넌트 정책 및 기능 관리 API")
public class TenantPolicyController {

    private final TenantPolicyService tenantPolicyService;
    private final TenantFeatureService tenantFeatureService;
    private final ObjectMapper objectMapper;

    // ===== Policy APIs =====

    @GetMapping("/policies")
    @Operation(summary = "테넌트 정책 목록 조회")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN')")
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
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN')")
    public ResponseEntity<ApiResponse<TenantPolicyResponse>> getPolicy(
            @PathVariable UUID tenantId,
            @PathVariable PolicyType policyType) {
        TenantPolicyResponse response = tenantPolicyService.getByTenantIdAndPolicyType(tenantId, policyType);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/policies/{policyType}")
    @Operation(summary = "테넌트 정책 저장/수정")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN')")
    public ResponseEntity<ApiResponse<TenantPolicyResponse>> saveOrUpdatePolicy(
            @PathVariable UUID tenantId,
            @PathVariable PolicyType policyType,
            @RequestBody Object body) {
        // Support both wrapped ({policyData: "..."}) and direct policy object body from FE
        UpdateTenantPolicyRequest request;
        try {
            // Try to deserialize as UpdateTenantPolicyRequest first
            String jsonBody = objectMapper.writeValueAsString(body);
            request = objectMapper.readValue(jsonBody, UpdateTenantPolicyRequest.class);
            if (request.getPolicyData() == null || request.getPolicyData().isBlank()) {
                // FE sent policy object directly → wrap it
                request = UpdateTenantPolicyRequest.builder()
                    .policyData(jsonBody)
                    .build();
            }
        } catch (Exception e) {
            // Fallback: treat entire body as policy data JSON
            try {
                String jsonBody = objectMapper.writeValueAsString(body);
                request = UpdateTenantPolicyRequest.builder()
                    .policyData(jsonBody)
                    .build();
            } catch (Exception ex) {
                throw new com.hrsaas.common.core.exception.BusinessException("TNT_012", "정책 데이터 파싱 실패");
            }
        }
        TenantPolicyResponse response = tenantPolicyService.saveOrUpdate(tenantId, policyType, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/policies/{policyType}")
    @Operation(summary = "테넌트 정책 삭제")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deletePolicy(
            @PathVariable UUID tenantId,
            @PathVariable PolicyType policyType) {
        tenantPolicyService.delete(tenantId, policyType);
        return ResponseEntity.ok(ApiResponse.success(null, "정책이 삭제되었습니다."));
    }

    // ===== Feature APIs =====

    @GetMapping("/features")
    @Operation(summary = "테넌트 기능 목록 조회")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN')")
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
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN')")
    public ResponseEntity<ApiResponse<TenantFeatureResponse>> getFeature(
            @PathVariable UUID tenantId,
            @PathVariable String featureCode) {
        TenantFeatureResponse response = tenantFeatureService.getByTenantIdAndFeatureCode(tenantId, featureCode);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping("/features/{featureCode}")
    @Operation(summary = "테넌트 기능 활성화/비활성화 (PATCH)")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN')")
    public ResponseEntity<ApiResponse<TenantFeatureResponse>> updateFeaturePatch(
            @PathVariable UUID tenantId,
            @PathVariable String featureCode,
            @Valid @RequestBody UpdateTenantFeatureRequest request) {
        TenantFeatureResponse response = tenantFeatureService.update(tenantId, featureCode, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/features/{featureCode}")
    @Operation(summary = "테넌트 기능 활성화/비활성화 (PUT)")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN')")
    public ResponseEntity<ApiResponse<TenantFeatureResponse>> updateFeaturePut(
            @PathVariable UUID tenantId,
            @PathVariable String featureCode,
            @Valid @RequestBody ToggleFeatureRequest request) {
        // Convert ToggleFeatureRequest to UpdateTenantFeatureRequest
        String configJson = null;
        if (request.getConfig() != null && !request.getConfig().isEmpty()) {
            try {
                configJson = objectMapper.writeValueAsString(request.getConfig());
            } catch (Exception e) {
                log.warn("Failed to serialize feature config", e);
            }
        }

        UpdateTenantFeatureRequest updateRequest = UpdateTenantFeatureRequest.builder()
            .isEnabled(request.getEnabled())
            .config(configJson)
            .build();

        TenantFeatureResponse response = tenantFeatureService.update(tenantId, featureCode, updateRequest);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/features/{featureCode}/enabled")
    @Operation(summary = "테넌트 기능 활성화 여부 확인")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Boolean>> isFeatureEnabled(
            @PathVariable UUID tenantId,
            @PathVariable String featureCode) {
        boolean enabled = tenantFeatureService.isFeatureEnabled(tenantId, featureCode);
        return ResponseEntity.ok(ApiResponse.success(enabled));
    }
}
