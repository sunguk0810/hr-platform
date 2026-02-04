package com.hrsaas.tenant.repository;

import com.hrsaas.tenant.domain.entity.PolicyType;
import com.hrsaas.tenant.domain.entity.TenantPolicy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TenantPolicyRepository extends JpaRepository<TenantPolicy, UUID> {

    Optional<TenantPolicy> findByTenantIdAndPolicyType(UUID tenantId, PolicyType policyType);

    @Query("SELECT p FROM TenantPolicy p WHERE p.tenantId = :tenantId ORDER BY p.policyType ASC")
    List<TenantPolicy> findAllByTenantId(@Param("tenantId") UUID tenantId);

    @Query("SELECT p FROM TenantPolicy p WHERE p.tenantId = :tenantId AND p.isActive = true " +
           "ORDER BY p.policyType ASC")
    List<TenantPolicy> findActiveByTenantId(@Param("tenantId") UUID tenantId);

    boolean existsByTenantIdAndPolicyType(UUID tenantId, PolicyType policyType);
}
