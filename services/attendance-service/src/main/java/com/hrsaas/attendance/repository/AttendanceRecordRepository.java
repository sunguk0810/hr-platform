package com.hrsaas.attendance.repository;

import com.hrsaas.attendance.domain.entity.AttendanceRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, UUID> {

    @Query("SELECT a FROM AttendanceRecord a WHERE a.tenantId = :tenantId AND a.employeeId = :employeeId " +
           "AND a.workDate = :workDate")
    Optional<AttendanceRecord> findByEmployeeIdAndWorkDate(@Param("tenantId") UUID tenantId,
                                                           @Param("employeeId") UUID employeeId,
                                                           @Param("workDate") LocalDate workDate);

    @Query("SELECT a FROM AttendanceRecord a WHERE a.tenantId = :tenantId AND a.employeeId = :employeeId " +
           "AND a.workDate BETWEEN :startDate AND :endDate ORDER BY a.workDate ASC")
    List<AttendanceRecord> findByEmployeeIdAndDateRange(@Param("tenantId") UUID tenantId,
                                                         @Param("employeeId") UUID employeeId,
                                                         @Param("startDate") LocalDate startDate,
                                                         @Param("endDate") LocalDate endDate);

    @Query("SELECT a FROM AttendanceRecord a WHERE a.tenantId = :tenantId AND a.workDate = :workDate")
    List<AttendanceRecord> findByWorkDate(@Param("tenantId") UUID tenantId, @Param("workDate") LocalDate workDate);

    /**
     * Find all attendance records for a tenant within a date range
     * Used for weekly work hours statistics
     */
    @Query("SELECT a FROM AttendanceRecord a WHERE a.tenantId = :tenantId " +
           "AND a.workDate BETWEEN :startDate AND :endDate ORDER BY a.employeeId, a.workDate ASC")
    List<AttendanceRecord> findByTenantIdAndDateRange(
        @Param("tenantId") UUID tenantId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate);

    /**
     * Aggregated work hours by employee for a date range
     */
    @Query("SELECT a.employeeId, SUM(a.workHours), SUM(a.overtimeMinutes) " +
           "FROM AttendanceRecord a WHERE a.tenantId = :tenantId " +
           "AND a.workDate BETWEEN :startDate AND :endDate " +
           "GROUP BY a.employeeId")
    List<Object[]> sumWorkHoursByEmployeeAndDateRange(
        @Param("tenantId") UUID tenantId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate);
}
