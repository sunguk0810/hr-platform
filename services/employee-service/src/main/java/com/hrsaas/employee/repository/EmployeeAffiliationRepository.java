package com.hrsaas.employee.repository;

import com.hrsaas.employee.domain.entity.EmployeeAffiliation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for employee affiliation data access.
 */
@Repository
public interface EmployeeAffiliationRepository extends JpaRepository<EmployeeAffiliation, UUID> {

    /**
     * Find active affiliations for an employee within a tenant.
     */
    @Query("SELECT a FROM EmployeeAffiliation a WHERE a.tenantId = :tenantId AND a.employeeId = :employeeId AND a.isActive = true ORDER BY a.isPrimary DESC")
    List<EmployeeAffiliation> findActiveByEmployeeId(@Param("tenantId") UUID tenantId, @Param("employeeId") UUID employeeId);

    /**
     * Find all affiliations (including inactive) for an employee within a tenant.
     */
    @Query("SELECT a FROM EmployeeAffiliation a WHERE a.tenantId = :tenantId AND a.employeeId = :employeeId ORDER BY a.isPrimary DESC, a.startDate DESC")
    List<EmployeeAffiliation> findAllByEmployeeId(@Param("tenantId") UUID tenantId, @Param("employeeId") UUID employeeId);

    /**
     * Find the primary affiliation for an employee within a tenant.
     */
    @Query("SELECT a FROM EmployeeAffiliation a WHERE a.tenantId = :tenantId AND a.employeeId = :employeeId AND a.isPrimary = true AND a.isActive = true")
    Optional<EmployeeAffiliation> findPrimaryByEmployeeId(@Param("tenantId") UUID tenantId, @Param("employeeId") UUID employeeId);

    /**
     * Find all active affiliations for a specific department within a tenant.
     */
    @Query("SELECT a FROM EmployeeAffiliation a WHERE a.tenantId = :tenantId AND a.departmentId = :departmentId AND a.isActive = true")
    List<EmployeeAffiliation> findActiveByDepartmentId(@Param("tenantId") UUID tenantId, @Param("departmentId") UUID departmentId);
}
