package com.hrsaas.tenant.repository;

import com.hrsaas.tenant.domain.dto.request.TenantSearchRequest;
import com.hrsaas.tenant.domain.entity.Tenant;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface TenantRepositoryCustom {

    Page<Tenant> search(TenantSearchRequest request, Pageable pageable);
}
