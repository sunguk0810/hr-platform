package com.hrsaas.employee.repository;

import com.hrsaas.employee.domain.entity.EmployeeNumberRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for employee number rule data access.
 */
@Repository
public interface EmployeeNumberRuleRepository extends JpaRepository<EmployeeNumberRule, UUID> {

    /**
     * Find the active rule for a tenant with a pessimistic write lock (for sequence generation).
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM EmployeeNumberRule r WHERE r.tenantId = :tenantId AND r.isActive = true")
    Optional<EmployeeNumberRule> findActiveByTenantIdForUpdate(@Param("tenantId") UUID tenantId);

    /**
     * Find the active rule for a tenant (read-only, no lock).
     */
    @Query("SELECT r FROM EmployeeNumberRule r WHERE r.tenantId = :tenantId AND r.isActive = true")
    Optional<EmployeeNumberRule> findActiveByTenantId(@Param("tenantId") UUID tenantId);
}
