package com.hrsaas.auth.controller;

import com.hrsaas.auth.domain.entity.AuditLog;
import com.hrsaas.auth.service.AuditLogService;
import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.common.response.PageResponse;
import com.hrsaas.common.tenant.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth/audit-logs")
@RequiredArgsConstructor
@Tag(name = "Audit Log", description = "감사 로그 조회 API")
public class AuditLogController {

    private final AuditLogService auditLogService;

    @GetMapping
    @Operation(summary = "감사 로그 목록 조회")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<PageResponse<AuditLog>> getAuditLogs(
            @PageableDefault(size = 20) Pageable pageable) {
        UUID tenantId = TenantContext.getCurrentTenant();
        Page<AuditLog> page = auditLogService.getAuditLogs(tenantId, pageable);
        return ApiResponse.success(PageResponse.from(page, page.getContent()));
    }

    @GetMapping("/actor/{actorId}")
    @Operation(summary = "사용자별 감사 로그 조회")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<PageResponse<AuditLog>> getAuditLogsByActor(
            @PathVariable String actorId,
            @PageableDefault(size = 20) Pageable pageable) {
        UUID tenantId = TenantContext.getCurrentTenant();
        Page<AuditLog> page = auditLogService.getAuditLogsByActor(tenantId, actorId, pageable);
        return ApiResponse.success(PageResponse.from(page, page.getContent()));
    }

    @GetMapping("/action/{action}")
    @Operation(summary = "액션별 감사 로그 조회")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<PageResponse<AuditLog>> getAuditLogsByAction(
            @PathVariable String action,
            @PageableDefault(size = 20) Pageable pageable) {
        UUID tenantId = TenantContext.getCurrentTenant();
        Page<AuditLog> page = auditLogService.getAuditLogsByAction(tenantId, action, pageable);
        return ApiResponse.success(PageResponse.from(page, page.getContent()));
    }
}
