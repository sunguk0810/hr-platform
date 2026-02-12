package com.hrsaas.certificate.client;

import com.hrsaas.certificate.domain.dto.client.TenantInfoResponse;
import com.hrsaas.common.response.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.UUID;

@FeignClient(name = "tenant-service", url = "${feign.client.tenant-service.url}")
public interface TenantClient {

    @GetMapping("/api/v1/tenants/internal/{id}")
    ApiResponse<TenantInfoResponse> getInternalInfo(@PathVariable("id") UUID id);
}
