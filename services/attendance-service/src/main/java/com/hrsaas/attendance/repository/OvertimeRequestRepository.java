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

    @Query("SELECT COUNT(o) FROM OvertimeRequest o WHERE o.tenantId = :tenantId " +
           "AND o.employeeId = :employeeId AND o.status = :status " +
           "AND o.overtimeDate BETWEEN :startDate AND :endDate")
    long countByEmployeeIdAndStatusAndDateRange(
        @Param("tenantId") UUID tenantId,
        @Param("employeeId") UUID employeeId,
        @Param("status") OvertimeStatus status,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate);

    @Query("SELECT COUNT(o) FROM OvertimeRequest o WHERE o.tenantId = :tenantId " +
           "AND o.employeeId = :employeeId " +
           "AND o.overtimeDate BETWEEN :startDate AND :endDate")
    long countByEmployeeIdAndDateRange(
        @Param("tenantId") UUID tenantId,
        @Param("employeeId") UUID employeeId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate);

    /**
     * 직원별 승인/완료된 초과근무 시간을 GROUP BY로 집계합니다.
     * queryWorkHoursFromDatabase 메모리 집계 대체용.
     */
    @Query("SELECT o.employeeId, o.employeeName, o.departmentId, o.departmentName, " +
           "COALESCE(SUM(CASE WHEN o.actualHours IS NOT NULL THEN o.actualHours ELSE o.plannedHours END), 0) " +
           "FROM OvertimeRequest o WHERE o.tenantId = :tenantId " +
           "AND o.overtimeDate BETWEEN :startDate AND :endDate " +
           "AND o.status IN ('APPROVED', 'COMPLETED') " +
           "GROUP BY o.employeeId, o.employeeName, o.departmentId, o.departmentName")
    List<Object[]> sumOvertimeHoursByEmployeeAndDateRange(
        @Param("tenantId") UUID tenantId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate);
}
