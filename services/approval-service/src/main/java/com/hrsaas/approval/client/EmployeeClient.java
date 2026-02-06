package com.hrsaas.approval.client;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.UUID;

@FeignClient(name = "employee-service", url = "${feign.client.employee-service.url:http://localhost:8084}")
public interface EmployeeClient {

    @GetMapping("/api/v1/employees/{employeeId}/manager")
    EmployeeResponse getManager(@PathVariable UUID employeeId);

    @GetMapping("/api/v1/employees/{employeeId}")
    EmployeeResponse getEmployee(@PathVariable UUID employeeId);

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    class EmployeeResponse {
        private UUID id;
        private String name;
        private String employeeNumber;
        private UUID departmentId;
        private String departmentName;
        private String positionCode;
        private String positionName;
        private UUID managerId;
    }
}
