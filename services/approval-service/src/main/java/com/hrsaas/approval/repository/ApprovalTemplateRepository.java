package com.hrsaas.approval.repository;

import com.hrsaas.approval.domain.entity.ApprovalTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ApprovalTemplateRepository extends JpaRepository<ApprovalTemplate, UUID> {

    Optional<ApprovalTemplate> findByCodeAndTenantId(String code, UUID tenantId);

    @Query("SELECT t FROM ApprovalTemplate t WHERE t.tenantId = :tenantId " +
           "ORDER BY t.sortOrder ASC, t.name ASC")
    List<ApprovalTemplate> findAllByTenantId(@Param("tenantId") UUID tenantId);

    @Query("SELECT t FROM ApprovalTemplate t WHERE t.tenantId = :tenantId AND t.isActive = true " +
           "ORDER BY t.sortOrder ASC, t.name ASC")
    List<ApprovalTemplate> findActiveByTenantId(@Param("tenantId") UUID tenantId);

    @Query("SELECT t FROM ApprovalTemplate t WHERE t.tenantId = :tenantId " +
           "AND t.documentType = :documentType AND t.isActive = true " +
           "ORDER BY t.sortOrder ASC")
    List<ApprovalTemplate> findByTenantIdAndDocumentType(
        @Param("tenantId") UUID tenantId,
        @Param("documentType") String documentType);

    boolean existsByCodeAndTenantId(String code, UUID tenantId);
}
