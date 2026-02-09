package com.hrsaas.employee.controller;

import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.employee.domain.dto.response.DashboardBirthdayResponse;
import com.hrsaas.employee.domain.dto.response.EmployeeSummaryResponse;
import com.hrsaas.employee.service.EmployeeDashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@Tag(name = "Dashboard-Employee", description = "대시보드 직원 API")
public class DashboardController {

    private final EmployeeDashboardService dashboardService;

    @GetMapping("/api/v1/dashboard/birthdays")
    @Operation(summary = "오늘/다가오는 생일")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<DashboardBirthdayResponse> getBirthdays() {
        return ApiResponse.success(dashboardService.getBirthdays());
    }

    @GetMapping("/api/v1/employees/summary")
    @Operation(summary = "직원 현황 요약 (Feign용)")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<EmployeeSummaryResponse> getEmployeeSummary() {
        return ApiResponse.success(dashboardService.getEmployeeSummary());
    }
}
