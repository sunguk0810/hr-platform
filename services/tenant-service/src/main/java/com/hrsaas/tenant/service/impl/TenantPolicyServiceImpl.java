package com.hrsaas.tenant.service.impl;

import com.hrsaas.common.core.exception.NotFoundException;
import com.hrsaas.tenant.domain.dto.request.UpdateTenantPolicyRequest;
import com.hrsaas.tenant.domain.dto.response.TenantPolicyResponse;
import com.hrsaas.tenant.domain.entity.PolicyType;
import com.hrsaas.tenant.domain.entity.TenantPolicy;
import com.hrsaas.tenant.repository.TenantPolicyRepository;
import com.hrsaas.tenant.repository.TenantRepository;
import com.hrsaas.tenant.service.TenantPolicyService;
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
public class TenantPolicyServiceImpl implements TenantPolicyService {

    private final TenantPolicyRepository tenantPolicyRepository;
    private final TenantRepository tenantRepository;

    @Override
    @Cacheable(value = "tenant-policy", key = "#tenantId + '-' + #policyType")
    public TenantPolicyResponse getByTenantIdAndPolicyType(UUID tenantId, PolicyType policyType) {
        validateTenantExists(tenantId);
        TenantPolicy policy = tenantPolicyRepository.findByTenantIdAndPolicyType(tenantId, policyType)
            .orElseThrow(() -> new NotFoundException("TNT_002", "정책을 찾을 수 없습니다: " + policyType));
        return TenantPolicyResponse.from(policy);
    }

    @Override
    public List<TenantPolicyResponse> getAllByTenantId(UUID tenantId) {
        validateTenantExists(tenantId);
        List<TenantPolicy> policies = tenantPolicyRepository.findAllByTenantId(tenantId);

        return policies.stream()
            .map(TenantPolicyResponse::from)
            .toList();
    }

    @Override
    public List<TenantPolicyResponse> getActiveByTenantId(UUID tenantId) {
        validateTenantExists(tenantId);
        List<TenantPolicy> policies = tenantPolicyRepository.findActiveByTenantId(tenantId);

        return policies.stream()
            .map(TenantPolicyResponse::from)
            .toList();
    }

    @Override
    @Transactional
    @CacheEvict(value = "tenant-policy", key = "#tenantId + '-' + #policyType")
    public TenantPolicyResponse saveOrUpdate(UUID tenantId, PolicyType policyType, UpdateTenantPolicyRequest request) {
        validateTenantExists(tenantId);

        TenantPolicy policy = tenantPolicyRepository.findByTenantIdAndPolicyType(tenantId, policyType)
            .orElseGet(() -> TenantPolicy.builder()
                .tenantId(tenantId)
                .policyType(policyType)
                .build());

        policy.updatePolicyData(request.getPolicyData());

        if (request.getIsActive() != null) {
            if (request.getIsActive()) {
                policy.activate();
            } else {
                policy.deactivate();
            }
        }

        TenantPolicy saved = tenantPolicyRepository.save(policy);
        log.info("Tenant policy saved: tenantId={}, policyType={}", tenantId, policyType);

        return TenantPolicyResponse.from(saved);
    }

    @Override
    @Transactional
    @CacheEvict(value = "tenant-policy", key = "#tenantId + '-' + #policyType")
    public void delete(UUID tenantId, PolicyType policyType) {
        TenantPolicy policy = tenantPolicyRepository.findByTenantIdAndPolicyType(tenantId, policyType)
            .orElseThrow(() -> new NotFoundException("TNT_002", "정책을 찾을 수 없습니다: " + policyType));
        tenantPolicyRepository.delete(policy);
        log.info("Tenant policy deleted: tenantId={}, policyType={}", tenantId, policyType);
    }

    private void validateTenantExists(UUID tenantId) {
        if (!tenantRepository.existsById(tenantId)) {
            throw new NotFoundException("TNT_001", "테넌트를 찾을 수 없습니다: " + tenantId);
        }
    }
}
