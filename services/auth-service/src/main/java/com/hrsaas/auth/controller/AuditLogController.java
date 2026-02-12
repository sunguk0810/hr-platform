package com.hrsaas.auth.controller;

import com.hrsaas.auth.domain.entity.AuditLog;
import com.hrsaas.auth.repository.AuditLogRepository;
import com.hrsaas.auth.service.AuditLogService;
import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.common.response.PageResponse;
import com.hrsaas.common.tenant.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/auth/audit-logs")
@RequiredArgsConstructor
@Tag(name = "Audit Log", description = "감사 로그 조회 API")
public class AuditLogController {

    private final AuditLogService auditLogService;
    private final AuditLogRepository auditLogRepository;

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

    @GetMapping("/{id}")
    @Operation(summary = "감사 로그 상세 조회")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<AuditLog> getAuditLogById(@PathVariable UUID id) {
        UUID tenantId = TenantContext.getCurrentTenant();
        AuditLog log = auditLogRepository.findById(id)
            .filter(item -> tenantId.equals(item.getTenantId()))
            .orElseThrow(() -> new com.hrsaas.common.core.exception.NotFoundException("AUTH_004", "감사 로그를 찾을 수 없습니다."));
        return ApiResponse.success(log);
    }

    @GetMapping("/export")
    @Operation(summary = "감사 로그 CSV 내보내기")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<byte[]> exportAuditLogs(@PageableDefault(size = 1000) Pageable pageable) {
        UUID tenantId = TenantContext.getCurrentTenant();
        Page<AuditLog> page = auditLogService.getAuditLogs(tenantId, pageable);

        String header = "id,actorId,actorName,action,resourceType,resourceId,description,createdAt\n";
        String body = page.getContent().stream()
            .map(log -> String.join(",",
                safe(log.getId() != null ? log.getId().toString() : ""),
                safe(log.getActorId()),
                safe(log.getActorName()),
                safe(log.getAction()),
                safe(log.getResourceType()),
                safe(log.getResourceId()),
                safe(log.getDescription()),
                safe(log.getCreatedAt() != null ? log.getCreatedAt().toString() : "")
            ))
            .collect(Collectors.joining("\n"));

        byte[] bytes = (header + body).getBytes(java.nio.charset.StandardCharsets.UTF_8);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.TEXT_PLAIN);
        headers.setContentDispositionFormData("attachment", "audit-logs.csv");
        return ResponseEntity.ok().headers(headers).body(bytes);
    }

    private String safe(String value) {
        if (value == null) {
            return "";
        }
        return "\"" + value.replace("\"", "\"\"") + "\"";
    }
}
