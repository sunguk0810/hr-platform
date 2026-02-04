package com.hrsaas.tenant.service.impl;

import com.hrsaas.common.core.exception.NotFoundException;
import com.hrsaas.tenant.domain.dto.request.UpdateTenantFeatureRequest;
import com.hrsaas.tenant.domain.dto.response.TenantFeatureResponse;
import com.hrsaas.tenant.domain.entity.TenantFeature;
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

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TenantFeatureServiceImpl implements TenantFeatureService {

    private final TenantFeatureRepository tenantFeatureRepository;
    private final TenantRepository tenantRepository;

    @Override
    @Cacheable(value = "tenant-feature", key = "#tenantId + '-' + #featureCode")
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
            .toList();
    }

    @Override
    public List<TenantFeatureResponse> getEnabledByTenantId(UUID tenantId) {
        validateTenantExists(tenantId);
        List<TenantFeature> features = tenantFeatureRepository.findEnabledByTenantId(tenantId);

        return features.stream()
            .map(TenantFeatureResponse::from)
            .toList();
    }

    @Override
    @Transactional
    @CacheEvict(value = "tenant-feature", key = "#tenantId + '-' + #featureCode")
    public TenantFeatureResponse update(UUID tenantId, String featureCode, UpdateTenantFeatureRequest request) {
        validateTenantExists(tenantId);

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

        return TenantFeatureResponse.from(saved);
    }

    @Override
    @Cacheable(value = "tenant-feature-enabled", key = "#tenantId + '-' + #featureCode")
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
