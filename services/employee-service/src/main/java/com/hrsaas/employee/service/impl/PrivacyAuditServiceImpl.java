package com.hrsaas.employee.service.impl;

import com.hrsaas.common.security.SecurityContextHolder;
import com.hrsaas.common.tenant.TenantContext;
import com.hrsaas.employee.domain.entity.PrivacyAccessLog;
import com.hrsaas.employee.repository.PrivacyAccessLogRepository;
import com.hrsaas.employee.service.PrivacyAuditService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PrivacyAuditServiceImpl implements PrivacyAuditService {

    private final PrivacyAccessLogRepository privacyAccessLogRepository;

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logAccess(UUID employeeId, String field, String reason) {
        UUID tenantId = TenantContext.getCurrentTenant();
        var currentUser = SecurityContextHolder.getCurrentUser();

        UUID actorId = currentUser != null ? currentUser.getUserId() : null;
        String actorName = currentUser != null ? currentUser.getUsername() : "SYSTEM";

        PrivacyAccessLog accessLog = PrivacyAccessLog.builder()
            .tenantId(tenantId)
            .actorId(actorId != null ? actorId : UUID.fromString("00000000-0000-0000-0000-000000000000"))
            .actorName(actorName)
            .employeeId(employeeId)
            .fieldName(field)
            .reason(reason)
            .build();

        privacyAccessLogRepository.save(accessLog);
        log.info("Privacy access logged: actor={}, employee={}, field={}", actorName, employeeId, field);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PrivacyAccessLog> getLogsByEmployee(UUID employeeId, Pageable pageable) {
        UUID tenantId = TenantContext.getCurrentTenant();
        return privacyAccessLogRepository.findByEmployeeIdAndTenantId(employeeId, tenantId, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PrivacyAccessLog> getLogsByActor(UUID actorId, Pageable pageable) {
        UUID tenantId = TenantContext.getCurrentTenant();
        return privacyAccessLogRepository.findByActorIdAndTenantId(actorId, tenantId, pageable);
    }
}
