package com.hrsaas.notification.client;

import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.notification.client.dto.EmployeeResponse;
import com.hrsaas.notification.config.SystemFeignConfig;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.UUID;

@FeignClient(
    name = "employee-service",
    url = "${feign.client.employee-service.url:http://localhost:8084}",
    configuration = SystemFeignConfig.class
)
public interface EmployeeServiceClient {

    @GetMapping("/api/v1/employees/{id}")
    ApiResponse<EmployeeResponse> getEmployee(@PathVariable UUID id);
}
