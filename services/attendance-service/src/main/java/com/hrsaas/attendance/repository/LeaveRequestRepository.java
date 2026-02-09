package com.hrsaas.attendance.repository;

import com.hrsaas.attendance.domain.entity.LeaveRequest;
import com.hrsaas.attendance.domain.entity.LeaveStatus;
import com.hrsaas.attendance.domain.entity.LeaveType;
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
public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, UUID> {

    @Query("SELECT l FROM LeaveRequest l WHERE l.tenantId = :tenantId AND l.employeeId = :employeeId ORDER BY l.createdAt DESC")
    Page<LeaveRequest> findByEmployeeId(@Param("tenantId") UUID tenantId, @Param("employeeId") UUID employeeId, Pageable pageable);

    @Query("SELECT l FROM LeaveRequest l WHERE l.tenantId = :tenantId AND l.employeeId = :employeeId " +
           "AND l.status = :status ORDER BY l.startDate DESC")
    List<LeaveRequest> findByEmployeeIdAndStatus(@Param("tenantId") UUID tenantId, @Param("employeeId") UUID employeeId,
                                                  @Param("status") LeaveStatus status);

    @Query("SELECT l FROM LeaveRequest l WHERE l.tenantId = :tenantId AND l.departmentId = :departmentId " +
           "AND l.startDate <= :endDate AND l.endDate >= :startDate AND l.status = 'APPROVED'")
    List<LeaveRequest> findApprovedByDepartmentAndDateRange(@Param("tenantId") UUID tenantId,
                                                            @Param("departmentId") UUID departmentId,
                                                            @Param("startDate") LocalDate startDate,
                                                            @Param("endDate") LocalDate endDate);

    @Query("SELECT l FROM LeaveRequest l WHERE l.tenantId = :tenantId AND l.employeeId = :employeeId " +
           "AND l.startDate <= :endDate AND l.endDate >= :startDate AND l.status IN ('PENDING', 'APPROVED')")
    List<LeaveRequest> findOverlappingRequests(@Param("tenantId") UUID tenantId, @Param("employeeId") UUID employeeId,
                                                @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT l FROM LeaveRequest l WHERE l.tenantId = :tenantId AND l.status = 'PENDING' ORDER BY l.createdAt ASC")
    Page<LeaveRequest> findPending(@Param("tenantId") UUID tenantId, Pageable pageable);

    @Query("SELECT l FROM LeaveRequest l WHERE l.tenantId = :tenantId AND l.status = 'PENDING' " +
           "AND l.departmentId = :departmentId ORDER BY l.createdAt ASC")
    Page<LeaveRequest> findPendingByDepartment(@Param("tenantId") UUID tenantId,
                                                @Param("departmentId") UUID departmentId, Pageable pageable);

    @Query("SELECT l FROM LeaveRequest l WHERE l.tenantId = :tenantId AND l.status = 'PENDING' " +
           "AND l.leaveType = :leaveType ORDER BY l.createdAt ASC")
    Page<LeaveRequest> findPendingByLeaveType(@Param("tenantId") UUID tenantId,
                                               @Param("leaveType") LeaveType leaveType, Pageable pageable);

    @Query("SELECT l FROM LeaveRequest l WHERE l.tenantId = :tenantId AND l.status = 'PENDING' " +
           "AND l.departmentId = :departmentId AND l.leaveType = :leaveType ORDER BY l.createdAt ASC")
    Page<LeaveRequest> findPendingByDepartmentAndLeaveType(@Param("tenantId") UUID tenantId,
                                                            @Param("departmentId") UUID departmentId,
                                                            @Param("leaveType") LeaveType leaveType, Pageable pageable);

    @Query("SELECT COUNT(l) FROM LeaveRequest l WHERE l.tenantId = :tenantId AND l.status = 'PENDING'")
    long countPending(@Param("tenantId") UUID tenantId);

    @Query("SELECT COUNT(l) FROM LeaveRequest l WHERE l.tenantId = :tenantId AND l.status = 'PENDING' " +
           "AND l.startDate <= :urgentDate")
    long countUrgentPending(@Param("tenantId") UUID tenantId, @Param("urgentDate") LocalDate urgentDate);

    @Query("SELECT COUNT(l) FROM LeaveRequest l WHERE l.tenantId = :tenantId AND l.status = 'PENDING' " +
           "AND l.createdAt >= :weekStart")
    long countPendingThisWeek(@Param("tenantId") UUID tenantId, @Param("weekStart") java.time.Instant weekStart);

    @Query("SELECT l FROM LeaveRequest l WHERE l.tenantId = :tenantId " +
           "AND l.startDate <= :endDate AND l.endDate >= :startDate AND l.status IN ('PENDING', 'APPROVED') " +
           "ORDER BY l.startDate ASC")
    List<LeaveRequest> findCalendarEvents(@Param("tenantId") UUID tenantId,
                                           @Param("startDate") LocalDate startDate,
                                           @Param("endDate") LocalDate endDate);

    @Query("SELECT l FROM LeaveRequest l WHERE l.tenantId = :tenantId AND l.departmentId = :departmentId " +
           "AND l.startDate <= :endDate AND l.endDate >= :startDate AND l.status IN ('PENDING', 'APPROVED') " +
           "ORDER BY l.startDate ASC")
    List<LeaveRequest> findCalendarEventsByDepartment(@Param("tenantId") UUID tenantId,
                                                       @Param("departmentId") UUID departmentId,
                                                       @Param("startDate") LocalDate startDate,
                                                       @Param("endDate") LocalDate endDate);
}
