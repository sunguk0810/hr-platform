package com.hrsaas.tenant.client;

import com.hrsaas.common.response.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;

@FeignClient(name = "employee-service", url = "${feign.client.employee-service.url:http://localhost:8084}",
             configuration = FeignClientConfig.class)
public interface EmployeeServiceClient {

    @GetMapping("/api/v1/employees/count")
    ApiResponse<Long> getEmployeeCount(@RequestHeader("X-Tenant-ID") String tenantId);
}
