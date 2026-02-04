package com.hrsaas.tenant.service;

import com.hrsaas.tenant.domain.dto.request.UpdateTenantFeatureRequest;
import com.hrsaas.tenant.domain.dto.response.TenantFeatureResponse;

import java.util.List;
import java.util.UUID;

public interface TenantFeatureService {

    TenantFeatureResponse getByTenantIdAndFeatureCode(UUID tenantId, String featureCode);

    List<TenantFeatureResponse> getAllByTenantId(UUID tenantId);

    List<TenantFeatureResponse> getEnabledByTenantId(UUID tenantId);

    TenantFeatureResponse update(UUID tenantId, String featureCode, UpdateTenantFeatureRequest request);

    boolean isFeatureEnabled(UUID tenantId, String featureCode);
}
