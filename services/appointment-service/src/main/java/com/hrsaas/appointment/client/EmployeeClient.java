package com.hrsaas.appointment.client;

import com.hrsaas.common.response.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.UUID;

@FeignClient(
    name = "employee-service",
    url = "${feign.client.employee-service.url:http://localhost:8084}"
)
public interface EmployeeClient {

    @GetMapping("/api/v1/employees/{employeeId}")
    ApiResponse<EmployeeResponse> getEmployee(@PathVariable UUID employeeId);

    record EmployeeResponse(
        UUID id,
        String employeeNumber,
        String name,
        String email,
        UUID departmentId,
        String departmentName,
        String positionCode,
        String positionName,
        String gradeCode,
        String gradeName,
        String jobCode,
        String jobName,
        UUID managerId
    ) {}
}
