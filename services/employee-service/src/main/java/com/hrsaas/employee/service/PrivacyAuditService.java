package com.hrsaas.employee.service;

import com.hrsaas.employee.domain.entity.PrivacyAccessLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

/**
 * Service for logging and querying privacy-related data access.
 */
public interface PrivacyAuditService {

    /**
     * Log a privacy data access event.
     */
    void logAccess(UUID employeeId, String field, String reason);

    /**
     * Get access logs for a specific employee.
     */
    Page<PrivacyAccessLog> getLogsByEmployee(UUID employeeId, Pageable pageable);

    /**
     * Get access logs by the actor who accessed the data.
     */
    Page<PrivacyAccessLog> getLogsByActor(UUID actorId, Pageable pageable);
}
