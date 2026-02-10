package com.hrsaas.auth.client;

import com.hrsaas.common.response.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.UUID;

/**
 * AUTH-G02: Employee Service Feign Client
 * Used for department/team checks (isSameDepartment, isSameTeam)
 */
@FeignClient(
    name = "employee-service",
    url = "${feign.client.employee-service.url:http://localhost:8084}",
    configuration = FeignClientConfig.class
)
public interface EmployeeServiceClient {

    @GetMapping("/api/v1/employees/{employeeId}")
    ApiResponse<EmployeeInfo> getEmployee(@PathVariable UUID employeeId);

    @GetMapping("/api/v1/employees/{employeeId}/department-id")
    ApiResponse<UUID> getDepartmentId(@PathVariable UUID employeeId);

    record EmployeeInfo(
        UUID id,
        String employeeNumber,
        String name,
        String email,
        UUID departmentId,
        String departmentName,
        UUID teamId,
        String teamName,
        String positionCode,
        String positionName,
        UUID managerId
    ) {}
}
