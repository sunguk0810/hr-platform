package com.hrsaas.tenant.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.common.response.PageResponse;
import com.hrsaas.tenant.domain.dto.policy.PasswordPolicyData;
import com.hrsaas.tenant.domain.dto.request.*;
import com.hrsaas.tenant.domain.dto.response.*;
import com.hrsaas.tenant.domain.entity.PlanType;
import com.hrsaas.tenant.domain.entity.Tenant;
import com.hrsaas.tenant.domain.entity.TenantStatus;
import com.hrsaas.tenant.repository.PolicyChangeHistoryRepository;
import com.hrsaas.tenant.repository.TenantRepository;
import com.hrsaas.tenant.service.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/v1/tenants")
@RequiredArgsConstructor
@Tag(name = "Tenant", description = "테넌트 관리 API")
public class TenantController {

    private final TenantService tenantService;
    private final TenantBrandingService brandingService;
    private final TenantHierarchyService hierarchyService;
    private final PolicyInheritanceService policyInheritanceService;
    private final PolicyChangeHistoryRepository policyChangeHistoryRepository;
    private final TenantRepository tenantRepository;
    private final TenantFeatureService tenantFeatureService;
    private final ObjectMapper objectMapper;

    // ===== CRUD Endpoints (response type updated to TenantDetailResponse) =====

    @PostMapping
    @Operation(summary = "테넌트 생성")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<TenantDetailResponse>> create(
            @Valid @RequestBody CreateTenantRequest request) {
        TenantDetailResponse response = tenantService.createWithDetail(request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.created(response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "테넌트 상세 조회")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @permissionChecker.isTenantAdmin()")
    public ResponseEntity<ApiResponse<TenantDetailResponse>> getById(@PathVariable UUID id) {
        TenantDetailResponse response = tenantService.getDetailById(id);
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
    public ResponseEntity<ApiResponse<PageResponse<TenantListItemResponse>>> getAll(
            @PageableDefault(size = 20) Pageable pageable) {
        PageResponse<TenantListItemResponse> response = tenantService.getAllList(pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/search")
    @Operation(summary = "테넌트 검색")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<PageResponse<TenantListItemResponse>>> search(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) TenantStatus status,
            @RequestParam(required = false) PlanType planType,
            @RequestParam(required = false) LocalDate contractEndDateFrom,
            @RequestParam(required = false) LocalDate contractEndDateTo,
            @RequestParam(required = false) UUID parentId,
            @RequestParam(required = false) Integer level,
            @PageableDefault(size = 20) Pageable pageable) {
        TenantSearchRequest request = TenantSearchRequest.builder()
            .keyword(keyword)
            .status(status)
            .planType(planType)
            .contractEndDateFrom(contractEndDateFrom)
            .contractEndDateTo(contractEndDateTo)
            .parentId(parentId)
            .level(level)
            .build();
        PageResponse<TenantListItemResponse> response = tenantService.searchList(request, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "테넌트 수정")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<TenantDetailResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateTenantRequest request) {
        TenantDetailResponse response = tenantService.updateWithDetail(id, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // ===== Status Endpoints =====

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

    @PostMapping("/{id}/status")
    @Operation(summary = "테넌트 통합 상태 변경")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<TenantDetailResponse>> changeStatus(
            @PathVariable UUID id,
            @Valid @RequestBody ChangeStatusRequest request) {
        TenantDetailResponse response = tenantService.changeStatus(id, request.getStatus());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // ===== Tree / Hierarchy Endpoints =====

    @GetMapping("/tree")
    @Operation(summary = "테넌트 트리 구조 조회")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<List<TenantTreeNodeResponse>>> getTenantTree() {
        List<TenantTreeNodeResponse> response = tenantService.getTenantTree();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{parentId}/subsidiaries")
    @Operation(summary = "자회사 목록 조회")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<List<TenantListItemResponse>>> getSubsidiaries(
            @PathVariable UUID parentId) {
        List<TenantListItemResponse> response = tenantService.getSubsidiaries(parentId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}/hierarchy")
    @Operation(summary = "조직 계층 조회")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN')")
    public ResponseEntity<ApiResponse<HierarchyDto>> getHierarchy(@PathVariable UUID id) {
        HierarchyDto response = hierarchyService.getHierarchy(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{id}/hierarchy")
    @Operation(summary = "조직 계층 수정")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN')")
    public ResponseEntity<ApiResponse<HierarchyDto>> updateHierarchy(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateHierarchyRequest request) {
        HierarchyDto response = hierarchyService.updateHierarchy(id, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // ===== Branding Endpoints =====

    @PutMapping("/{id}/branding")
    @Operation(summary = "브랜딩 설정 수정")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN')")
    public ResponseEntity<ApiResponse<TenantDetailResponse>> updateBranding(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateBrandingRequest request) {
        TenantDetailResponse response = brandingService.updateBranding(id, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping(value = "/{id}/branding/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "브랜딩 이미지 업로드")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadBrandingImage(
            @PathVariable UUID id,
            @RequestParam("type") String type,
            @RequestParam("file") MultipartFile file) {
        Map<String, String> response = brandingService.uploadBrandingImage(id, type, file);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // ===== Policy Inheritance & History Endpoints =====

    @PostMapping("/{parentId}/inherit-policies")
    @Operation(summary = "정책 상속")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> inheritPolicies(
            @PathVariable UUID parentId,
            @Valid @RequestBody InheritPoliciesRequest request) {
        policyInheritanceService.inheritPolicies(parentId, request);
        return ResponseEntity.ok(ApiResponse.success(null, "정책이 상속되었습니다."));
    }

    @GetMapping("/{id}/policy-history")
    @Operation(summary = "정책 변경 이력 조회")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN')")
    public ResponseEntity<ApiResponse<List<PolicyChangeHistoryResponse>>> getPolicyHistory(
            @PathVariable UUID id,
            @RequestParam(required = false) String policyType) {
        List<PolicyChangeHistoryResponse> response;
        if (policyType != null && !policyType.isBlank()) {
            response = policyChangeHistoryRepository.findByTenantIdAndPolicyTypeOrderByChangedAtDesc(id, policyType)
                .stream()
                .map(PolicyChangeHistoryResponse::from)
                .collect(Collectors.toList());
        } else {
            response = policyChangeHistoryRepository.findByTenantIdOrderByChangedAtDesc(id)
                .stream()
                .map(PolicyChangeHistoryResponse::from)
                .collect(Collectors.toList());
        }
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // ===== Module Settings Endpoint =====

    @PutMapping("/{id}/modules")
    @Operation(summary = "모듈 설정 수정")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN')")
    public ResponseEntity<ApiResponse<TenantDetailResponse>> updateModules(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateModulesRequest request) {
        Tenant tenant = tenantRepository.findById(id)
            .orElseThrow(() -> new com.hrsaas.common.core.exception.NotFoundException("TNT_001", "테넌트를 찾을 수 없습니다: " + id));
        try {
            tenant.setAllowedModules(objectMapper.writeValueAsString(request.getModules()));
        } catch (Exception e) {
            throw new com.hrsaas.common.core.exception.BusinessException("TNT_011", "모듈 설정 직렬화 실패");
        }
        tenantRepository.save(tenant);
        TenantDetailResponse response = tenantService.getDetailById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // ===== Current Tenant Convenience APIs =====

    @GetMapping("/current/features/{featureCode}")
    @Operation(summary = "현재 테넌트 기능 조회 (인증된 사용자의 테넌트)")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<TenantFeatureResponse>> getCurrentTenantFeature(
            @PathVariable String featureCode) {
        UUID tenantId = com.hrsaas.common.security.SecurityContextHolder.getCurrentTenantId();
        if (tenantId == null) {
            throw new com.hrsaas.common.core.exception.BusinessException("TNT_010", "테넌트 정보를 확인할 수 없습니다.");
        }
        try {
            TenantFeatureResponse response = tenantFeatureService.getByTenantIdAndFeatureCode(tenantId, featureCode);
            return ResponseEntity.ok(ApiResponse.success(response));
        } catch (com.hrsaas.common.core.exception.NotFoundException e) {
            // Feature not configured - return disabled default
            TenantFeatureResponse defaultResponse = TenantFeatureResponse.builder()
                .tenantId(tenantId)
                .featureCode(featureCode)
                .isEnabled(false)
                .build();
            return ResponseEntity.ok(ApiResponse.success(defaultResponse));
        }
    }

    @PutMapping("/current/features/{featureCode}")
    @Operation(summary = "현재 테넌트 기능 수정 (인증된 사용자의 테넌트)")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN')")
    public ResponseEntity<ApiResponse<TenantFeatureResponse>> updateCurrentTenantFeature(
            @PathVariable String featureCode,
            @Valid @RequestBody ToggleFeatureRequest request) {
        UUID tenantId = com.hrsaas.common.security.SecurityContextHolder.getCurrentTenantId();
        if (tenantId == null) {
            throw new com.hrsaas.common.core.exception.BusinessException("TNT_010", "테넌트 정보를 확인할 수 없습니다.");
        }
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

    // ===== Internal Service APIs =====

    @GetMapping("/{tenantId}/status")
    @Operation(summary = "테넌트 상태 조회 (내부 서비스용)")
    public ResponseEntity<ApiResponse<String>> getStatus(@PathVariable UUID tenantId) {
        TenantStatus status = tenantService.getStatus(tenantId);
        return ResponseEntity.ok(ApiResponse.success(status.name()));
    }

    @GetMapping("/{tenantId}/password-policy")
    @Operation(summary = "비밀번호 정책 조회 (내부 서비스용)")
    public ResponseEntity<ApiResponse<PasswordPolicyData>> getPasswordPolicy(@PathVariable UUID tenantId) {
        PasswordPolicyData policy = tenantService.getPasswordPolicy(tenantId);
        return ResponseEntity.ok(ApiResponse.success(policy));
    }

    @GetMapping("/internal/{id}")
    @Operation(summary = "테넌트 내부 정보 조회 (서비스 간 통신용)")
    public ResponseEntity<ApiResponse<TenantInternalResponse>> getInternalInfo(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(tenantService.getInternalInfo(id)));
    }
}
