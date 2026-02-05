package com.hrsaas.employee.repository;

import com.hrsaas.employee.domain.entity.CondolenceEventType;
import com.hrsaas.employee.domain.entity.CondolencePolicy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CondolencePolicyRepository extends JpaRepository<CondolencePolicy, UUID> {

    @Query("SELECT p FROM CondolencePolicy p WHERE p.tenantId = :tenantId " +
           "ORDER BY p.sortOrder ASC, p.eventType ASC")
    List<CondolencePolicy> findAllByTenantId(@Param("tenantId") UUID tenantId);

    @Query("SELECT p FROM CondolencePolicy p WHERE p.tenantId = :tenantId AND p.isActive = true " +
           "ORDER BY p.sortOrder ASC, p.eventType ASC")
    List<CondolencePolicy> findActiveByTenantId(@Param("tenantId") UUID tenantId);

    Optional<CondolencePolicy> findByIdAndTenantId(UUID id, UUID tenantId);

    @Query("SELECT p FROM CondolencePolicy p WHERE p.tenantId = :tenantId AND p.eventType = :eventType " +
           "AND p.isActive = true")
    Optional<CondolencePolicy> findByTenantIdAndEventType(
        @Param("tenantId") UUID tenantId,
        @Param("eventType") CondolenceEventType eventType);

    boolean existsByTenantIdAndEventType(UUID tenantId, CondolenceEventType eventType);
}
