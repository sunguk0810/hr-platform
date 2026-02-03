package com.hrsaas.approval.repository;

import com.hrsaas.approval.domain.entity.ApprovalDocument;
import com.hrsaas.approval.domain.entity.ApprovalStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ApprovalDocumentRepository extends JpaRepository<ApprovalDocument, UUID> {

    Optional<ApprovalDocument> findByDocumentNumber(String documentNumber);

    @Query("SELECT d FROM ApprovalDocument d WHERE d.tenantId = :tenantId AND d.drafterId = :drafterId ORDER BY d.createdAt DESC")
    Page<ApprovalDocument> findByDrafterId(@Param("tenantId") UUID tenantId, @Param("drafterId") UUID drafterId, Pageable pageable);

    @Query("SELECT d FROM ApprovalDocument d WHERE d.tenantId = :tenantId AND d.status = :status ORDER BY d.createdAt DESC")
    Page<ApprovalDocument> findByStatus(@Param("tenantId") UUID tenantId, @Param("status") ApprovalStatus status, Pageable pageable);

    @Query("SELECT d FROM ApprovalDocument d JOIN d.approvalLines l " +
           "WHERE d.tenantId = :tenantId AND l.approverId = :approverId AND l.status = 'ACTIVE' " +
           "ORDER BY l.activatedAt ASC")
    Page<ApprovalDocument> findPendingByApproverId(@Param("tenantId") UUID tenantId, @Param("approverId") UUID approverId, Pageable pageable);

    @Query("SELECT d FROM ApprovalDocument d JOIN d.approvalLines l " +
           "WHERE d.tenantId = :tenantId AND l.approverId = :approverId AND l.status IN ('APPROVED', 'REJECTED') " +
           "ORDER BY l.completedAt DESC")
    Page<ApprovalDocument> findProcessedByApproverId(@Param("tenantId") UUID tenantId, @Param("approverId") UUID approverId, Pageable pageable);

    @Query("SELECT COUNT(d) FROM ApprovalDocument d JOIN d.approvalLines l " +
           "WHERE d.tenantId = :tenantId AND l.approverId = :approverId AND l.status = 'ACTIVE'")
    long countPendingByApproverId(@Param("tenantId") UUID tenantId, @Param("approverId") UUID approverId);

    @Query("SELECT MAX(d.documentNumber) FROM ApprovalDocument d WHERE d.tenantId = :tenantId AND d.documentNumber LIKE :prefix%")
    Optional<String> findMaxDocumentNumberByPrefix(@Param("tenantId") UUID tenantId, @Param("prefix") String prefix);
}
