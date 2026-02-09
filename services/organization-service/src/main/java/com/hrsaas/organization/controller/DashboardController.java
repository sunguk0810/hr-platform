package com.hrsaas.organization.controller;

import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.organization.domain.dto.response.OrgSummaryResponse;
import com.hrsaas.organization.service.OrganizationDashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@Tag(name = "Dashboard-Organization", description = "대시보드 조직/공지 API")
public class DashboardController {

    private final OrganizationDashboardService dashboardService;

    @GetMapping("/api/v1/dashboard/announcements")
    @Operation(summary = "최근 공지사항")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Map<String, Object>> getAnnouncements() {
        return ApiResponse.success(dashboardService.getDashboardAnnouncements());
    }

    @GetMapping("/api/v1/organizations/summary")
    @Operation(summary = "조직 현황 요약 (Feign용)")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<OrgSummaryResponse> getOrgSummary() {
        return ApiResponse.success(dashboardService.getOrgSummary());
    }
}
