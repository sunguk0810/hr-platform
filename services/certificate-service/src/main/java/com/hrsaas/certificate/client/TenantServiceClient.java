package com.hrsaas.certificate.client;

import com.hrsaas.certificate.client.dto.TenantClientResponse;
import com.hrsaas.common.response.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.UUID;

@FeignClient(
    name = "tenant-service",
    url = "${feign.client.tenant-service.url:http://localhost:8082}"
)
public interface TenantServiceClient {

    @GetMapping("/api/v1/tenants/{id}/basic")
    ApiResponse<TenantClientResponse> getBasicInfo(@PathVariable("id") UUID id);
}
