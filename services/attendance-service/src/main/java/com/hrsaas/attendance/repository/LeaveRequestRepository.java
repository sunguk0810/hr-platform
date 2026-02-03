package com.hrsaas.attendance.repository;

import com.hrsaas.attendance.domain.entity.LeaveRequest;
import com.hrsaas.attendance.domain.entity.LeaveStatus;
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
}
