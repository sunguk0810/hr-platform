package com.hrsaas.tenant.service;

import com.hrsaas.tenant.domain.dto.request.UpdateTenantPolicyRequest;
import com.hrsaas.tenant.domain.dto.response.TenantPolicyResponse;
import com.hrsaas.tenant.domain.entity.PolicyType;

import java.util.List;
import java.util.UUID;

public interface TenantPolicyService {

    TenantPolicyResponse getByTenantIdAndPolicyType(UUID tenantId, PolicyType policyType);

    List<TenantPolicyResponse> getAllByTenantId(UUID tenantId);

    List<TenantPolicyResponse> getActiveByTenantId(UUID tenantId);

    TenantPolicyResponse saveOrUpdate(UUID tenantId, PolicyType policyType, UpdateTenantPolicyRequest request);

    void delete(UUID tenantId, PolicyType policyType);
}
