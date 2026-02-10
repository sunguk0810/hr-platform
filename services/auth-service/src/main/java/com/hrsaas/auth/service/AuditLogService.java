package com.hrsaas.auth.service;

import com.hrsaas.auth.domain.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

/**
 * AUTH-G01: 감사 로그 서비스
 */
public interface AuditLogService {

    void log(UUID tenantId, String actorId, String actorName, String action,
             String resourceType, String resourceId, String description,
             String ipAddress, String userAgent);

    void logFailure(UUID tenantId, String actorId, String actorName, String action,
                    String resourceType, String resourceId, String description,
                    String ipAddress, String userAgent, String errorMessage);

    Page<AuditLog> getAuditLogs(UUID tenantId, Pageable pageable);

    Page<AuditLog> getAuditLogsByActor(UUID tenantId, String actorId, Pageable pageable);

    Page<AuditLog> getAuditLogsByAction(UUID tenantId, String action, Pageable pageable);
}
