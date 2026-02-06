package com.hrsaas.attendance.repository;

import com.hrsaas.attendance.domain.entity.LeaveAccrualRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LeaveAccrualRuleRepository extends JpaRepository<LeaveAccrualRule, UUID> {

    @Query("SELECT r FROM LeaveAccrualRule r WHERE r.tenantId = :tenantId AND r.isActive = true")
    List<LeaveAccrualRule> findActiveByTenantId(@Param("tenantId") UUID tenantId);

    @Query("SELECT r FROM LeaveAccrualRule r WHERE r.tenantId = :tenantId AND r.leaveTypeCode = :leaveTypeCode")
    Optional<LeaveAccrualRule> findByTenantIdAndLeaveTypeCode(@Param("tenantId") UUID tenantId, @Param("leaveTypeCode") String leaveTypeCode);

    @Query("SELECT r FROM LeaveAccrualRule r WHERE r.tenantId = :tenantId AND r.accrualType = :accrualType AND r.isActive = true")
    List<LeaveAccrualRule> findActiveByTenantIdAndAccrualType(@Param("tenantId") UUID tenantId, @Param("accrualType") String accrualType);
}
