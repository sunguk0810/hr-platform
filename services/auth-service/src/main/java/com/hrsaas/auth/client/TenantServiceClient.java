package com.hrsaas.auth.client;

import com.hrsaas.auth.domain.dto.PasswordPolicyDto;
import com.hrsaas.auth.domain.dto.TenantDto;
import com.hrsaas.common.response.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.UUID;

@FeignClient(
    name = "tenant-service",
    url = "${feign.client.tenant-service.url:http://localhost:8082}",
    configuration = FeignClientConfig.class
)
public interface TenantServiceClient {

    @GetMapping("/api/v1/tenants/{tenantId}/password-policy")
    ApiResponse<PasswordPolicyDto> getPasswordPolicy(@PathVariable UUID tenantId);

    @GetMapping("/api/v1/tenants/code/{tenantCode}")
    ApiResponse<TenantDto> getByTenantCode(@PathVariable String tenantCode);
}
