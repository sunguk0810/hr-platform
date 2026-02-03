package com.hrsaas.tenant.service;

import com.hrsaas.common.response.PageResponse;
import com.hrsaas.tenant.domain.dto.request.CreateTenantRequest;
import com.hrsaas.tenant.domain.dto.request.UpdateTenantRequest;
import com.hrsaas.tenant.domain.dto.response.TenantResponse;
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
}
