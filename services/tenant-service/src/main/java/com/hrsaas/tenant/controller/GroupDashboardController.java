package com.hrsaas.tenant.controller;

import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.tenant.service.GroupDashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/tenants/group")
@RequiredArgsConstructor
@Tag(name = "GroupDashboard", description = "그룹 통합 대시보드 API")
public class GroupDashboardController {

    private final GroupDashboardService dashboardService;

    @GetMapping("/dashboard")
    @Operation(summary = "그룹 통합 대시보드 조회")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboard() {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getGroupDashboard()));
    }
}
