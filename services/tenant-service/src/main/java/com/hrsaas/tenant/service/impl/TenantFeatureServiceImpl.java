package com.hrsaas.tenant.service.impl;

import com.hrsaas.common.cache.CacheNames;
import com.hrsaas.common.core.exception.BusinessException;
import com.hrsaas.common.core.exception.NotFoundException;
import com.hrsaas.common.event.EventPublisher;
import com.hrsaas.tenant.domain.constant.PlanFeatureMapping;
import com.hrsaas.tenant.domain.dto.request.UpdateTenantFeatureRequest;
import com.hrsaas.tenant.domain.dto.response.TenantFeatureResponse;
import com.hrsaas.tenant.domain.entity.Tenant;
import com.hrsaas.tenant.domain.entity.TenantFeature;
import com.hrsaas.tenant.domain.event.TenantFeatureChangedEvent;
import com.hrsaas.tenant.repository.TenantFeatureRepository;
import com.hrsaas.tenant.repository.TenantRepository;
import com.hrsaas.tenant.service.TenantFeatureService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TenantFeatureServiceImpl implements TenantFeatureService {

    private final TenantFeatureRepository tenantFeatureRepository;
    private final TenantRepository tenantRepository;
    private final EventPublisher eventPublisher;

    @Override
    @Cacheable(value = CacheNames.TENANT_FEATURE, key = "#tenantId + '-' + #featureCode")
    public TenantFeatureResponse getByTenantIdAndFeatureCode(UUID tenantId, String featureCode) {
        validateTenantExists(tenantId);
        TenantFeature feature = tenantFeatureRepository.findByTenantIdAndFeatureCode(tenantId, featureCode)
            .orElseThrow(() -> new NotFoundException("TNT_003", "기능을 찾을 수 없습니다: " + featureCode));
        return TenantFeatureResponse.from(feature);
    }

    @Override
    public List<TenantFeatureResponse> getAllByTenantId(UUID tenantId) {
        validateTenantExists(tenantId);
        List<TenantFeature> features = tenantFeatureRepository.findAllByTenantId(tenantId);

        return features.stream()
            .map(TenantFeatureResponse::from)
            .collect(Collectors.toList());
    }

    @Override
    public List<TenantFeatureResponse> getEnabledByTenantId(UUID tenantId) {
        validateTenantExists(tenantId);
        List<TenantFeature> features = tenantFeatureRepository.findEnabledByTenantId(tenantId);

        return features.stream()
            .map(TenantFeatureResponse::from)
            .collect(Collectors.toList());
    }

    @Override
    @Transactional
    @CacheEvict(value = CacheNames.TENANT_FEATURE, key = "#tenantId + '-' + #featureCode")
    public TenantFeatureResponse update(UUID tenantId, String featureCode, UpdateTenantFeatureRequest request) {
        validateTenantExists(tenantId);

        // Plan-based feature restriction
        if (Boolean.TRUE.equals(request.getIsEnabled())) {
            Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new NotFoundException("TNT_001", "테넌트를 찾을 수 없습니다: " + tenantId));
            if (!PlanFeatureMapping.isAllowed(tenant.getPlanType(), featureCode)) {
                throw new BusinessException("TNT_006",
                    "현재 플랜(" + tenant.getPlanType() + ")에서 사용할 수 없는 기능입니다: " + featureCode);
            }
        }

        TenantFeature feature = tenantFeatureRepository.findByTenantIdAndFeatureCode(tenantId, featureCode)
            .orElseGet(() -> TenantFeature.builder()
                .tenantId(tenantId)
                .featureCode(featureCode)
                .build());

        if (request.getIsEnabled() != null) {
            if (request.getIsEnabled()) {
                feature.enable();
            } else {
                feature.disable();
            }
        }

        if (request.getConfig() != null) {
            feature.updateConfig(request.getConfig());
        }

        TenantFeature saved = tenantFeatureRepository.save(feature);
        log.info("Tenant feature updated: tenantId={}, featureCode={}, isEnabled={}",
            tenantId, featureCode, saved.getIsEnabled());

        // Publish event
        eventPublisher.publish(TenantFeatureChangedEvent.builder()
            .tenantId(tenantId)
            .featureCode(featureCode)
            .isEnabled(saved.getIsEnabled())
            .build());

        return TenantFeatureResponse.from(saved);
    }

    @Override
    @Cacheable(value = CacheNames.TENANT_FEATURE_ENABLED, key = "#tenantId + '-' + #featureCode")
    public boolean isFeatureEnabled(UUID tenantId, String featureCode) {
        return tenantFeatureRepository.findByTenantIdAndFeatureCode(tenantId, featureCode)
            .map(TenantFeature::getIsEnabled)
            .orElse(false);
    }

    private void validateTenantExists(UUID tenantId) {
        if (!tenantRepository.existsById(tenantId)) {
            throw new NotFoundException("TNT_001", "테넌트를 찾을 수 없습니다: " + tenantId);
        }
    }
}
