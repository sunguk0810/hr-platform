package com.hrsaas.tenant.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hrsaas.tenant.domain.constant.DefaultTenantSettings;
import com.hrsaas.tenant.domain.dto.response.*;
import com.hrsaas.tenant.domain.entity.Tenant;
import com.hrsaas.tenant.domain.entity.TenantFeature;
import com.hrsaas.tenant.domain.entity.TenantPolicy;
import com.hrsaas.tenant.domain.entity.PolicyType;
import com.hrsaas.tenant.repository.TenantFeatureRepository;
import com.hrsaas.tenant.repository.TenantPolicyRepository;
import com.hrsaas.tenant.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;

@Slf4j
@Component
@RequiredArgsConstructor
public class TenantDetailAssembler {

    private final TenantPolicyRepository tenantPolicyRepository;
    private final TenantFeatureRepository tenantFeatureRepository;
    private final TenantRepository tenantRepository;
    private final ObjectMapper objectMapper;

    public TenantDetailResponse toDetailResponse(Tenant tenant) {
        return TenantDetailResponse.builder()
            .id(tenant.getId())
            .code(tenant.getCode())
            .name(tenant.getName())
            .nameEn(tenant.getNameEn())
            .description(tenant.getDescription())
            .businessNumber(tenant.getBusinessNumber())
            .logoUrl(tenant.getLogoUrl())
            .status(tenant.getStatus())
            .planType(tenant.getPlanType())
            .branding(parseBranding(tenant.getBrandingData()))
            .policies(buildPolicies(tenant))
            .settings(parseSettings(tenant.getSettingsData()))
            .features(buildFeatures(tenant.getId()))
            .hierarchy(parseHierarchy(tenant.getHierarchyData()))
            .employeeCount(0) // Default; Feign call optional
            .departmentCount(0) // Default; Feign call optional
            .adminEmail(tenant.getAdminEmail())
            .adminName(tenant.getAdminName())
            .contractStartDate(tenant.getContractStartDate())
            .contractEndDate(tenant.getContractEndDate())
            .parentId(tenant.getParentId())
            .parentName(resolveParentName(tenant.getParentId()))
            .level(tenant.getLevel())
            .createdAt(tenant.getCreatedAt())
            .updatedAt(tenant.getUpdatedAt())
            .createdBy(tenant.getCreatedBy())
            .updatedBy(tenant.getUpdatedBy())
            .build();
    }

    public TenantListItemResponse toListItem(Tenant tenant) {
        return TenantListItemResponse.builder()
            .id(tenant.getId())
            .code(tenant.getCode())
            .name(tenant.getName())
            .status(tenant.getStatus())
            .employeeCount(0)
            .adminEmail(tenant.getAdminEmail())
            .createdAt(tenant.getCreatedAt())
            .parentId(tenant.getParentId())
            .parentName(resolveParentName(tenant.getParentId()))
            .level(tenant.getLevel())
            .build();
    }

    private BrandingDto parseBranding(String json) {
        if (json == null || json.isBlank()) {
            json = DefaultTenantSettings.DEFAULT_BRANDING;
        }
        try {
            return objectMapper.readValue(json, BrandingDto.class);
        } catch (Exception e) {
            log.warn("Failed to parse branding data, using default", e);
            return BrandingDto.builder()
                .primaryColor("#2563eb")
                .secondaryColor("#1e40af")
                .build();
        }
    }

    private SettingsDto parseSettings(String json) {
        if (json == null || json.isBlank()) {
            json = DefaultTenantSettings.DEFAULT_SETTINGS;
        }
        try {
            return objectMapper.readValue(json, SettingsDto.class);
        } catch (Exception e) {
            log.warn("Failed to parse settings data, using default", e);
            return SettingsDto.builder()
                .locale("ko")
                .timezone("Asia/Seoul")
                .dateFormat("yyyy-MM-dd")
                .timeFormat("HH:mm")
                .currency("KRW")
                .fiscalYearStartMonth(1)
                .build();
        }
    }

    private HierarchyDto parseHierarchy(String json) {
        if (json == null || json.isBlank()) {
            json = DefaultTenantSettings.DEFAULT_HIERARCHY;
        }
        try {
            return objectMapper.readValue(json, HierarchyDto.class);
        } catch (Exception e) {
            log.warn("Failed to parse hierarchy data, using default", e);
            return HierarchyDto.builder().levels(List.of()).build();
        }
    }

    private PoliciesDto buildPolicies(Tenant tenant) {
        List<TenantPolicy> policies = tenantPolicyRepository.findAllByTenantId(tenant.getId());
        Map<PolicyType, Object> policyMap = new HashMap<>();

        for (TenantPolicy policy : policies) {
            try {
                Object parsed = objectMapper.readValue(policy.getPolicyData(), Object.class);
                policyMap.put(policy.getPolicyType(), parsed);
            } catch (Exception e) {
                log.warn("Failed to parse policy data: type={}", policy.getPolicyType(), e);
            }
        }

        List<String> allowedModules = parseModules(tenant.getAllowedModules());

        return PoliciesDto.builder()
            .maxEmployees(tenant.getMaxEmployees())
            .maxDepartments(tenant.getMaxDepartments())
            .allowedModules(allowedModules)
            .leavePolicy(policyMap.get(PolicyType.LEAVE))
            .attendancePolicy(policyMap.get(PolicyType.ATTENDANCE))
            .approvalPolicy(policyMap.get(PolicyType.APPROVAL))
            .passwordPolicy(policyMap.get(PolicyType.PASSWORD))
            .securityPolicy(policyMap.get(PolicyType.SECURITY))
            .notificationPolicy(policyMap.get(PolicyType.NOTIFICATION))
            .organizationPolicy(policyMap.get(PolicyType.ORGANIZATION))
            .build();
    }

    private List<FeatureDto> buildFeatures(UUID tenantId) {
        List<TenantFeature> features = tenantFeatureRepository.findAllByTenantId(tenantId);
        List<FeatureDto> result = new ArrayList<>();

        for (TenantFeature feature : features) {
            Object configObj = null;
            if (feature.getConfig() != null && !feature.getConfig().isBlank()) {
                try {
                    configObj = objectMapper.readValue(feature.getConfig(), Object.class);
                } catch (Exception e) {
                    log.warn("Failed to parse feature config: code={}", feature.getFeatureCode(), e);
                }
            }
            result.add(FeatureDto.builder()
                .code(feature.getFeatureCode())
                .enabled(feature.getIsEnabled())
                .config(configObj)
                .build());
        }
        return result;
    }

    private List<String> parseModules(String json) {
        if (json == null || json.isBlank()) {
            json = DefaultTenantSettings.DEFAULT_MODULES;
        }
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            log.warn("Failed to parse allowed modules, using default", e);
            return List.of("EMPLOYEE", "ORGANIZATION", "ATTENDANCE", "LEAVE", "APPROVAL", "MDM", "NOTIFICATION");
        }
    }

    private String resolveParentName(UUID parentId) {
        if (parentId == null) {
            return null;
        }
        return tenantRepository.findById(parentId)
            .map(Tenant::getName)
            .orElse(null);
    }
}
