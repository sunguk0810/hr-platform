package com.hrsaas.tenant.service;

import com.hrsaas.tenant.client.AuthServiceClient;
import com.hrsaas.tenant.client.dto.CreateAdminRequest;
import com.hrsaas.tenant.domain.constant.DefaultPolicyData;
import com.hrsaas.tenant.domain.constant.PlanFeatureMapping;
import com.hrsaas.tenant.domain.entity.PlanType;
import com.hrsaas.tenant.domain.entity.PolicyType;
import com.hrsaas.tenant.domain.entity.Tenant;
import com.hrsaas.tenant.domain.entity.TenantFeature;
import com.hrsaas.tenant.domain.entity.TenantPolicy;
import com.hrsaas.tenant.repository.TenantFeatureRepository;
import com.hrsaas.tenant.repository.TenantPolicyRepository;
import com.hrsaas.tenant.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class TenantProvisioningService {

    private final TenantPolicyRepository tenantPolicyRepository;
    private final TenantFeatureRepository tenantFeatureRepository;
    private final TenantRepository tenantRepository;
    private final Optional<AuthServiceClient> authServiceClient;

    @Transactional
    public void provision(UUID tenantId, PlanType planType) {
        log.info("Provisioning tenant: tenantId={}, planType={}", tenantId, planType);

        // Create default policies
        for (PolicyType policyType : PolicyType.values()) {
            if (!tenantPolicyRepository.existsByTenantIdAndPolicyType(tenantId, policyType)) {
                TenantPolicy policy = TenantPolicy.builder()
                    .tenantId(tenantId)
                    .policyType(policyType)
                    .policyData(DefaultPolicyData.get(policyType))
                    .build();
                tenantPolicyRepository.save(policy);
            }
        }

        // Create features based on plan
        Set<String> features = PlanFeatureMapping.getFeatures(planType);
        for (String featureCode : features) {
            if (!tenantFeatureRepository.existsByTenantIdAndFeatureCode(tenantId, featureCode)) {
                TenantFeature feature = TenantFeature.builder()
                    .tenantId(tenantId)
                    .featureCode(featureCode)
                    .isEnabled(true)
                    .build();
                tenantFeatureRepository.save(feature);
            }
        }

        log.info("Tenant provisioned: tenantId={}, policies={}, features={}",
            tenantId, PolicyType.values().length, features.size());

        // Create admin account
        createAdminAccount(tenantId);
    }

    private void createAdminAccount(UUID tenantId) {
        authServiceClient.ifPresent(client -> {
            try {
                Tenant tenant = tenantRepository.findById(tenantId).orElse(null);
                if (tenant == null || tenant.getEmail() == null) {
                    log.warn("Skipping admin creation: tenant or email not found for tenantId={}", tenantId);
                    return;
                }

                CreateAdminRequest request = CreateAdminRequest.builder()
                    .tenantId(tenantId)
                    .tenantCode(tenant.getCode())
                    .username("admin@" + tenant.getCode())
                    .email(tenant.getEmail())
                    .role("TENANT_ADMIN")
                    .build();

                client.createAdminUser(request);
                log.info("Admin account created for tenant: tenantId={}", tenantId);
            } catch (Exception e) {
                log.warn("Failed to create admin account for tenant: tenantId={}, error={}",
                    tenantId, e.getMessage());
            }
        });
    }
}
