package com.hrsaas.employee.client;

import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.employee.client.dto.DepartmentClientResponse;
import com.hrsaas.employee.client.dto.GradeClientResponse;
import com.hrsaas.employee.client.dto.PositionClientResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;

import java.util.List;

/**
 * Feign Client for Organization Service
 * Used to retrieve departments, positions, and grades for cross-tenant transfers
 */
@FeignClient(
    name = "organization-service",
    url = "${feign.client.organization-service.url:http://localhost:8083}",
    configuration = FeignClientConfig.class
)
public interface OrganizationServiceClient {

    /**
     * Get all departments for a specific tenant
     * @param tenantId Target tenant ID (passed via X-Tenant-ID header)
     */
    @GetMapping("/api/v1/departments")
    ApiResponse<List<DepartmentClientResponse>> getDepartments(
        @RequestHeader("X-Tenant-ID") String tenantId
    );

    /**
     * Get all positions for a specific tenant
     * @param tenantId Target tenant ID (passed via X-Tenant-ID header)
     */
    @GetMapping("/api/v1/positions")
    ApiResponse<List<PositionClientResponse>> getPositions(
        @RequestHeader("X-Tenant-ID") String tenantId
    );

    /**
     * Get all grades for a specific tenant
     * @param tenantId Target tenant ID (passed via X-Tenant-ID header)
     */
    @GetMapping("/api/v1/grades")
    ApiResponse<List<GradeClientResponse>> getGrades(
        @RequestHeader("X-Tenant-ID") String tenantId
    );
}
