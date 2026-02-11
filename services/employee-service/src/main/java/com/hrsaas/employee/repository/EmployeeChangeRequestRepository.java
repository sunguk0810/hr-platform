package com.hrsaas.employee.repository;

import com.hrsaas.employee.domain.entity.EmployeeChangeRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Repository for employee change request data access.
 */
@Repository
public interface EmployeeChangeRequestRepository extends JpaRepository<EmployeeChangeRequest, UUID> {

    /**
     * Find all change requests for an employee, ordered by creation time descending.
     */
    @Query("SELECT r FROM EmployeeChangeRequest r WHERE r.tenantId = :tenantId AND r.employeeId = :employeeId ORDER BY r.createdAt DESC")
    List<EmployeeChangeRequest> findByEmployeeId(@Param("tenantId") UUID tenantId, @Param("employeeId") UUID employeeId);

    /**
     * Find all change requests with a specific status, ordered by creation time descending.
     */
    @Query("SELECT r FROM EmployeeChangeRequest r WHERE r.tenantId = :tenantId AND r.status = :status ORDER BY r.createdAt DESC")
    List<EmployeeChangeRequest> findByStatus(@Param("tenantId") UUID tenantId, @Param("status") String status);

    /**
     * Find all change requests for an employee with a specific status, ordered by creation time descending.
     */
    @Query("SELECT r FROM EmployeeChangeRequest r WHERE r.tenantId = :tenantId AND r.employeeId = :employeeId AND r.status = :status ORDER BY r.createdAt DESC")
    List<EmployeeChangeRequest> findByEmployeeIdAndStatus(@Param("tenantId") UUID tenantId, @Param("employeeId") UUID employeeId, @Param("status") String status);

    /**
     * Count change requests for an employee within a date range (for monthly limit validation).
     */
    @Query("SELECT COUNT(r) FROM EmployeeChangeRequest r WHERE r.tenantId = :tenantId AND r.employeeId = :employeeId AND r.createdAt BETWEEN :startDate AND :endDate")
    long countByEmployeeIdAndCreatedAtBetween(@Param("tenantId") UUID tenantId, @Param("employeeId") UUID employeeId, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
}
