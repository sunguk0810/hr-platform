package com.hrsaas.tenant.client;

import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.tenant.client.dto.CreateAdminRequest;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "auth-service", url = "${feign.client.auth-service.url:http://localhost:8081}",
             configuration = FeignClientConfig.class)
public interface AuthServiceClient {

    @PostMapping("/api/v1/auth/users")
    ApiResponse<Void> createAdminUser(@RequestBody CreateAdminRequest request);
}
