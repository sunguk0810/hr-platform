package com.hrsaas.auth.service.impl;

import com.hrsaas.auth.domain.entity.AuditLog;
import com.hrsaas.auth.repository.AuditLogRepository;
import com.hrsaas.auth.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditLogServiceImpl implements AuditLogService {

    private final AuditLogRepository auditLogRepository;

    @Override
    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(UUID tenantId, String actorId, String actorName, String action,
                    String resourceType, String resourceId, String description,
                    String ipAddress, String userAgent) {
        try {
            AuditLog auditLog = AuditLog.builder()
                    .tenantId(tenantId)
                    .actorId(actorId)
                    .actorName(actorName)
                    .action(action)
                    .resourceType(resourceType)
                    .resourceId(resourceId)
                    .description(description)
                    .ipAddress(ipAddress)
                    .userAgent(userAgent)
                    .status("SUCCESS")
                    .build();
            auditLogRepository.save(auditLog);
        } catch (Exception e) {
            log.warn("Failed to save audit log: action={}, actor={}", action, actorId, e);
        }
    }

    @Override
    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logFailure(UUID tenantId, String actorId, String actorName, String action,
                           String resourceType, String resourceId, String description,
                           String ipAddress, String userAgent, String errorMessage) {
        try {
            AuditLog auditLog = AuditLog.builder()
                    .tenantId(tenantId)
                    .actorId(actorId)
                    .actorName(actorName)
                    .action(action)
                    .resourceType(resourceType)
                    .resourceId(resourceId)
                    .description(description)
                    .ipAddress(ipAddress)
                    .userAgent(userAgent)
                    .status("FAILURE")
                    .errorMessage(errorMessage)
                    .build();
            auditLogRepository.save(auditLog);
        } catch (Exception e) {
            log.warn("Failed to save audit log failure: action={}, actor={}", action, actorId, e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AuditLog> getAuditLogs(UUID tenantId, Pageable pageable) {
        return auditLogRepository.findByTenantId(tenantId, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AuditLog> getAuditLogsByActor(UUID tenantId, String actorId, Pageable pageable) {
        return auditLogRepository.findByTenantIdAndActorId(tenantId, actorId, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AuditLog> getAuditLogsByAction(UUID tenantId, String action, Pageable pageable) {
        return auditLogRepository.findByTenantIdAndAction(tenantId, action, pageable);
    }
}
