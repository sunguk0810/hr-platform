package com.hrsaas.tenant.repository;

import com.hrsaas.tenant.domain.entity.PolicyChangeHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PolicyChangeHistoryRepository extends JpaRepository<PolicyChangeHistory, UUID> {

    List<PolicyChangeHistory> findByTenantIdOrderByChangedAtDesc(UUID tenantId);

    List<PolicyChangeHistory> findByTenantIdAndPolicyTypeOrderByChangedAtDesc(UUID tenantId, String policyType);
}
