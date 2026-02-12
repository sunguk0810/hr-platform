package com.hrsaas.attendance.client;

import com.hrsaas.attendance.client.dto.EmployeeBasicDto;
import com.hrsaas.common.response.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;
import java.util.UUID;

@FeignClient(
    name = "employee-service",
    url = "${feign.client.employee-service.url:http://localhost:8084}",
    configuration = FeignClientConfig.class
)
public interface EmployeeServiceClient {

    @GetMapping("/api/v1/employees/active")
    ApiResponse<List<EmployeeBasicDto>> getActiveEmployees(@RequestParam(required = false) String status);

    @GetMapping("/api/v1/employees/list")
    ApiResponse<List<EmployeeBasicDto>> getEmployees(@RequestParam(required = false) UUID departmentId, @RequestParam(required = false) String status);
}
