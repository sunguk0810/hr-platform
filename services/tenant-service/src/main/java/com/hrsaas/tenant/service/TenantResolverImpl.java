package com.hrsaas.tenant.service;

import com.hrsaas.common.cache.CacheNames;
import com.hrsaas.common.tenant.TenantInfo;
import com.hrsaas.common.tenant.TenantResolver;
import com.hrsaas.tenant.domain.entity.Tenant;
import com.hrsaas.tenant.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class TenantResolverImpl implements TenantResolver {

    private final TenantRepository tenantRepository;

    @Override
    @Cacheable(value = CacheNames.TENANT, key = "'resolve:' + #tenantId")
    public TenantInfo resolve(UUID tenantId) {
        Tenant tenant = tenantRepository.findById(tenantId).orElse(null);
        if (tenant == null) {
            log.warn("Tenant not found: {}", tenantId);
            return null;
        }
        return toTenantInfo(tenant);
    }

    @Override
    @Cacheable(value = CacheNames.TENANT, key = "'resolve-code:' + #tenantCode")
    public TenantInfo resolveByCode(String tenantCode) {
        Tenant tenant = tenantRepository.findByCode(tenantCode).orElse(null);
        if (tenant == null) {
            log.warn("Tenant not found by code: {}", tenantCode);
            return null;
        }
        return toTenantInfo(tenant);
    }

    @Override
    @Cacheable(value = CacheNames.TENANT, key = "'active:' + #tenantId")
    public boolean isActive(UUID tenantId) {
        return tenantRepository.findById(tenantId)
            .map(Tenant::isActive)
            .orElse(false);
    }

    private TenantInfo toTenantInfo(Tenant tenant) {
        return TenantInfo.builder()
            .tenantId(tenant.getId())
            .tenantCode(tenant.getCode())
            .tenantName(tenant.getName())
            .active(tenant.isActive())
            .build();
    }
}
