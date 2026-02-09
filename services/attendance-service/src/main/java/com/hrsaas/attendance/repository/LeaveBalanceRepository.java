package com.hrsaas.attendance.repository;

import com.hrsaas.attendance.domain.entity.LeaveBalance;
import com.hrsaas.attendance.domain.entity.LeaveType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LeaveBalanceRepository extends JpaRepository<LeaveBalance, UUID> {

    @Query("SELECT b FROM LeaveBalance b WHERE b.tenantId = :tenantId AND b.employeeId = :employeeId AND b.year = :year")
    List<LeaveBalance> findByEmployeeIdAndYear(@Param("tenantId") UUID tenantId,
                                                @Param("employeeId") UUID employeeId,
                                                @Param("year") Integer year);

    @Query("SELECT b FROM LeaveBalance b WHERE b.tenantId = :tenantId AND b.employeeId = :employeeId " +
           "AND b.year = :year AND b.leaveType = :leaveType")
    Optional<LeaveBalance> findByEmployeeIdAndYearAndType(@Param("tenantId") UUID tenantId,
                                                          @Param("employeeId") UUID employeeId,
                                                          @Param("year") Integer year,
                                                          @Param("leaveType") LeaveType leaveType);

    /**
     * 여러 직원의 특정 연도 휴가 잔여일을 배치로 조회합니다.
     * getPendingLeaves N+1 쿼리 해결을 위한 배치 조회 메서드.
     */
    @Query("SELECT b FROM LeaveBalance b WHERE b.tenantId = :tenantId AND b.year = :year " +
           "AND b.employeeId IN :employeeIds")
    List<LeaveBalance> findByEmployeeIdsAndYear(@Param("tenantId") UUID tenantId,
                                                 @Param("employeeIds") Collection<UUID> employeeIds,
                                                 @Param("year") Integer year);
}
