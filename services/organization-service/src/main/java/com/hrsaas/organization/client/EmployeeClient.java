package com.hrsaas.organization.client;

import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.organization.client.dto.BulkTransferRequest;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@FeignClient(
    name = "employee-service",
    url = "${services.employee-service.url:http://localhost:8084}",
    fallback = EmployeeClientFallback.class
)
public interface EmployeeClient {

    @GetMapping("/api/v1/employees/count")
    ApiResponse<Long> countByDepartmentId(@RequestParam("departmentId") UUID departmentId);

    @GetMapping("/api/v1/employees/{id}/exists")
    ApiResponse<Boolean> existsById(@PathVariable("id") UUID id);

    @PostMapping("/api/v1/employees/bulk-transfer")
    ApiResponse<Integer> bulkTransferDepartment(@RequestBody BulkTransferRequest request);

    @GetMapping("/api/v1/employees/count-by-grade")
    ApiResponse<Long> countByGradeId(@RequestParam("gradeId") UUID gradeId);

    @GetMapping("/api/v1/employees/count-by-position")
    ApiResponse<Long> countByPositionId(@RequestParam("positionId") UUID positionId);
}
