package com.hrsaas.approval.client;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.UUID;

@FeignClient(name = "organization-service", url = "${feign.client.organization-service.url:http://localhost:8083}")
public interface OrganizationClient {

    @GetMapping("/api/v1/departments/{departmentId}/head")
    DepartmentHeadResponse getDepartmentHead(@PathVariable UUID departmentId);

    @GetMapping("/api/v1/departments/position-holder")
    DepartmentHeadResponse getPositionHolder(
        @RequestParam String positionCode,
        @RequestParam UUID departmentId);

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    class DepartmentHeadResponse {
        private UUID employeeId;
        private String employeeName;
        private String positionName;
        private String departmentName;
    }
}
