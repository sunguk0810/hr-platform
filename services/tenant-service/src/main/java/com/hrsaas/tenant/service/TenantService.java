package com.hrsaas.tenant.service;

import com.hrsaas.common.response.PageResponse;
import com.hrsaas.tenant.domain.dto.policy.PasswordPolicyData;
import com.hrsaas.tenant.domain.dto.request.CreateTenantRequest;
import com.hrsaas.tenant.domain.dto.request.TenantSearchRequest;
import com.hrsaas.tenant.domain.dto.request.UpdateTenantRequest;
import com.hrsaas.tenant.domain.dto.response.TenantResponse;
import com.hrsaas.tenant.domain.entity.TenantStatus;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface TenantService {

    TenantResponse create(CreateTenantRequest request);

    TenantResponse getById(UUID id);

    TenantResponse getByCode(String code);

    PageResponse<TenantResponse> getAll(Pageable pageable);

    TenantResponse update(UUID id, UpdateTenantRequest request);

    TenantResponse activate(UUID id);

    TenantResponse suspend(UUID id);

    void terminate(UUID id);

    PageResponse<TenantResponse> search(TenantSearchRequest request, Pageable pageable);

    TenantStatus getStatus(UUID id);

    PasswordPolicyData getPasswordPolicy(UUID tenantId);
}
