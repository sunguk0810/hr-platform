package com.hrsaas.attendance.client;

import com.hrsaas.attendance.client.dto.TenantBasicDto;
import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.common.response.PageResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

@FeignClient(
    name = "tenant-service",
    url = "${feign.client.tenant-service.url:http://localhost:8082}",
    configuration = FeignClientConfig.class
)
public interface TenantServiceClient {

    @GetMapping("/api/v1/tenants")
    ApiResponse<PageResponse<TenantBasicDto>> getAllTenants();
}
