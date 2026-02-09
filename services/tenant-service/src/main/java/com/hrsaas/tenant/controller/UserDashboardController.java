package com.hrsaas.tenant.controller;

import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.tenant.domain.dto.response.DashboardOrgSummaryResponse;
import com.hrsaas.tenant.domain.dto.response.DashboardStatisticsResponse;
import com.hrsaas.tenant.service.UserDashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
@Tag(name = "UserDashboard", description = "사용자 대시보드 API")
public class UserDashboardController {

    private final UserDashboardService dashboardService;

    @GetMapping("/org-summary")
    @Operation(summary = "조직 현황 (관리자)")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<DashboardOrgSummaryResponse> getOrgSummary() {
        return ApiResponse.success(dashboardService.getOrgSummary());
    }

    @GetMapping("/statistics")
    @Operation(summary = "HR 주요 지표 (관리자)")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<DashboardStatisticsResponse> getStatistics() {
        return ApiResponse.success(dashboardService.getStatistics());
    }

    @GetMapping("/widgets")
    @Operation(summary = "위젯 설정")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Map<String, Object>> getWidgets() {
        return ApiResponse.success(dashboardService.getWidgets());
    }
}
