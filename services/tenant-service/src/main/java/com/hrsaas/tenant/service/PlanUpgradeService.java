package com.hrsaas.tenant.service;

import com.hrsaas.tenant.domain.constant.PlanFeatureMapping;
import com.hrsaas.tenant.domain.entity.PlanType;
import com.hrsaas.tenant.domain.entity.TenantFeature;
import com.hrsaas.tenant.repository.TenantFeatureRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class PlanUpgradeService {

    private final TenantFeatureRepository tenantFeatureRepository;

    @Transactional
    public void syncFeatures(UUID tenantId, PlanType newPlan) {
        Set<String> allowedFeatures = PlanFeatureMapping.getFeatures(newPlan);
        List<TenantFeature> existingFeatures = tenantFeatureRepository.findAllByTenantId(tenantId);

        // Enable features allowed by new plan
        for (String featureCode : allowedFeatures) {
            boolean exists = existingFeatures.stream()
                .anyMatch(f -> f.getFeatureCode().equals(featureCode));
            if (!exists) {
                TenantFeature feature = TenantFeature.builder()
                    .tenantId(tenantId)
                    .featureCode(featureCode)
                    .isEnabled(true)
                    .build();
                tenantFeatureRepository.save(feature);
                log.info("Feature enabled for plan upgrade: tenantId={}, feature={}", tenantId, featureCode);
            }
        }

        // Disable features not allowed by new plan
        for (TenantFeature feature : existingFeatures) {
            if (!allowedFeatures.contains(feature.getFeatureCode()) && feature.getIsEnabled()) {
                feature.disable();
                tenantFeatureRepository.save(feature);
                log.info("Feature disabled for plan change: tenantId={}, feature={}", tenantId, feature.getFeatureCode());
            }
        }
    }
}
