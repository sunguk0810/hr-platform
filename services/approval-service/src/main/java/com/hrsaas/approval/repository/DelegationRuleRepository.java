package com.hrsaas.approval.repository;

import com.hrsaas.approval.domain.entity.DelegationRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DelegationRuleRepository extends JpaRepository<DelegationRule, UUID> {

    @Query("SELECT d FROM DelegationRule d WHERE d.tenantId = :tenantId " +
           "AND d.delegatorId = :delegatorId ORDER BY d.startDate DESC")
    List<DelegationRule> findByDelegatorId(
        @Param("tenantId") UUID tenantId,
        @Param("delegatorId") UUID delegatorId);

    @Query("SELECT d FROM DelegationRule d WHERE d.tenantId = :tenantId " +
           "AND d.delegateId = :delegateId AND d.isActive = true ORDER BY d.startDate DESC")
    List<DelegationRule> findByDelegateId(
        @Param("tenantId") UUID tenantId,
        @Param("delegateId") UUID delegateId);

    @Query("SELECT d FROM DelegationRule d WHERE d.tenantId = :tenantId " +
           "AND d.delegatorId = :delegatorId AND d.isActive = true " +
           "AND :date BETWEEN d.startDate AND d.endDate")
    Optional<DelegationRule> findEffectiveRule(
        @Param("tenantId") UUID tenantId,
        @Param("delegatorId") UUID delegatorId,
        @Param("date") LocalDate date);

    @Query("SELECT d FROM DelegationRule d WHERE d.tenantId = :tenantId " +
           "AND d.isActive = true ORDER BY d.startDate DESC")
    List<DelegationRule> findAllActiveByTenantId(@Param("tenantId") UUID tenantId);

    @Query("SELECT d FROM DelegationRule d WHERE d.tenantId = :tenantId " +
           "ORDER BY d.createdAt DESC")
    List<DelegationRule> findAllByTenantId(@Param("tenantId") UUID tenantId);
}
