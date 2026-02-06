package com.hrsaas.approval.repository;

import com.hrsaas.approval.domain.entity.ArbitraryApprovalRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ArbitraryApprovalRuleRepository extends JpaRepository<ArbitraryApprovalRule, UUID> {

    @Query("SELECT r FROM ArbitraryApprovalRule r WHERE r.tenantId = :tenantId " +
           "AND r.isActive = true AND (r.documentType = :documentType OR r.documentType IS NULL) " +
           "ORDER BY r.documentType DESC NULLS LAST")
    List<ArbitraryApprovalRule> findActiveRules(
        @Param("tenantId") UUID tenantId,
        @Param("documentType") String documentType);

    @Query("SELECT r FROM ArbitraryApprovalRule r WHERE r.tenantId = :tenantId ORDER BY r.createdAt DESC")
    List<ArbitraryApprovalRule> findAllByTenantId(@Param("tenantId") UUID tenantId);
}
