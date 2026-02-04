package com.hrsaas.attendance.repository;

import com.hrsaas.attendance.domain.entity.OvertimeRequest;
import com.hrsaas.attendance.domain.entity.OvertimeStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface OvertimeRequestRepository extends JpaRepository<OvertimeRequest, UUID> {

    @Query("SELECT o FROM OvertimeRequest o WHERE o.tenantId = :tenantId " +
           "AND o.employeeId = :employeeId ORDER BY o.overtimeDate DESC")
    Page<OvertimeRequest> findByEmployeeId(
        @Param("tenantId") UUID tenantId,
        @Param("employeeId") UUID employeeId,
        Pageable pageable);

    @Query("SELECT o FROM OvertimeRequest o WHERE o.tenantId = :tenantId " +
           "AND o.employeeId = :employeeId AND o.status = :status ORDER BY o.overtimeDate DESC")
    List<OvertimeRequest> findByEmployeeIdAndStatus(
        @Param("tenantId") UUID tenantId,
        @Param("employeeId") UUID employeeId,
        @Param("status") OvertimeStatus status);

    @Query("SELECT o FROM OvertimeRequest o WHERE o.tenantId = :tenantId " +
           "AND o.departmentId = :departmentId AND o.status = :status ORDER BY o.overtimeDate DESC")
    List<OvertimeRequest> findByDepartmentIdAndStatus(
        @Param("tenantId") UUID tenantId,
        @Param("departmentId") UUID departmentId,
        @Param("status") OvertimeStatus status);

    @Query("SELECT o FROM OvertimeRequest o WHERE o.tenantId = :tenantId " +
           "AND o.overtimeDate BETWEEN :startDate AND :endDate ORDER BY o.overtimeDate DESC")
    List<OvertimeRequest> findByDateRange(
        @Param("tenantId") UUID tenantId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate);

    @Query("SELECT o FROM OvertimeRequest o WHERE o.tenantId = :tenantId " +
           "AND o.employeeId = :employeeId " +
           "AND o.overtimeDate BETWEEN :startDate AND :endDate")
    List<OvertimeRequest> findByEmployeeIdAndDateRange(
        @Param("tenantId") UUID tenantId,
        @Param("employeeId") UUID employeeId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate);

    @Query("SELECT SUM(o.actualHours) FROM OvertimeRequest o WHERE o.tenantId = :tenantId " +
           "AND o.employeeId = :employeeId AND o.status = 'COMPLETED' " +
           "AND o.overtimeDate BETWEEN :startDate AND :endDate")
    java.math.BigDecimal sumActualHoursByEmployeeIdAndDateRange(
        @Param("tenantId") UUID tenantId,
        @Param("employeeId") UUID employeeId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate);
}
