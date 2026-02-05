package com.hrsaas.employee.client;

import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.common.response.PageResponse;
import com.hrsaas.employee.client.dto.TenantClientResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Feign Client for Tenant Service
 * Used to retrieve tenant information for cross-tenant transfers
 */
@FeignClient(
    name = "tenant-service",
    url = "${feign.client.tenant-service.url:http://localhost:8082}",
    configuration = FeignClientConfig.class
)
public interface TenantServiceClient {

    /**
     * Get all tenants (paginated)
     * Note: This endpoint requires SUPER_ADMIN role
     */
    @GetMapping("/api/v1/tenants")
    ApiResponse<PageResponse<TenantClientResponse>> getAllTenants();
}
