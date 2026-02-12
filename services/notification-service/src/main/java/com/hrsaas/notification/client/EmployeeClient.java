package com.hrsaas.notification.client;

import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.notification.domain.dto.external.EmployeeResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;

import java.util.UUID;

@FeignClient(name = "employee-service", url = "${application.employee-service.url:http://employee-service:8080}")
public interface EmployeeClient {

    @GetMapping("/api/v1/employees/{id}")
    ApiResponse<EmployeeResponse> getEmployee(
            @RequestHeader("Authorization") String token,
            @PathVariable("id") UUID id);
}
