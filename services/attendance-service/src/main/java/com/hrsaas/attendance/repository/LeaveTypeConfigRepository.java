package com.hrsaas.attendance.repository;

import com.hrsaas.attendance.domain.entity.LeaveTypeConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LeaveTypeConfigRepository extends JpaRepository<LeaveTypeConfig, UUID> {

    @Query("SELECT c FROM LeaveTypeConfig c WHERE c.tenantId = :tenantId AND c.isActive = true ORDER BY c.code")
    List<LeaveTypeConfig> findActiveByTenantId(@Param("tenantId") UUID tenantId);

    @Query("SELECT c FROM LeaveTypeConfig c WHERE c.tenantId = :tenantId AND c.code = :code")
    Optional<LeaveTypeConfig> findByTenantIdAndCode(@Param("tenantId") UUID tenantId, @Param("code") String code);

    @Query("SELECT c FROM LeaveTypeConfig c WHERE c.tenantId = :tenantId ORDER BY c.code")
    List<LeaveTypeConfig> findAllByTenantId(@Param("tenantId") UUID tenantId);
}
