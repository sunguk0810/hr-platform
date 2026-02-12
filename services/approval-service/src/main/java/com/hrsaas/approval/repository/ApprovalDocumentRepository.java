package com.hrsaas.approval.repository;

import com.hrsaas.approval.domain.entity.ApprovalDocument;
import com.hrsaas.approval.domain.entity.ApprovalStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
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

    // New methods with @EntityGraph for N+1 query optimization
    @EntityGraph(value = "ApprovalDocument.withLinesAndHistories", type = EntityGraph.EntityGraphType.LOAD)
    @Query("SELECT d FROM ApprovalDocument d WHERE d.id = :id")
    Optional<ApprovalDocument> findByIdWithLinesAndHistories(@Param("id") UUID id);

    @EntityGraph(value = "ApprovalDocument.withLines", type = EntityGraph.EntityGraphType.LOAD)
    @Query("SELECT d FROM ApprovalDocument d WHERE d.tenantId = :tenantId AND d.drafterId = :drafterId ORDER BY d.createdAt DESC")
    Page<ApprovalDocument> findByDrafterIdWithLines(@Param("tenantId") UUID tenantId, @Param("drafterId") UUID drafterId, Pageable pageable);

    @Query("SELECT d FROM ApprovalDocument d WHERE d.tenantId = :tenantId AND d.drafterId = :drafterId ORDER BY d.createdAt DESC")
    Page<ApprovalDocument> findByDrafterId(@Param("tenantId") UUID tenantId, @Param("drafterId") UUID drafterId, Pageable pageable);

    @Query("SELECT d FROM ApprovalDocument d WHERE d.tenantId = :tenantId AND d.status = :status ORDER BY d.createdAt DESC")
    Page<ApprovalDocument> findByStatus(@Param("tenantId") UUID tenantId, @Param("status") ApprovalStatus status, Pageable pageable);

    @EntityGraph(value = "ApprovalDocument.withLines", type = EntityGraph.EntityGraphType.LOAD)
    @Query("SELECT d FROM ApprovalDocument d JOIN d.approvalLines l " +
           "WHERE d.tenantId = :tenantId AND l.approverId = :approverId AND l.status = 'ACTIVE' " +
           "ORDER BY l.activatedAt ASC")
    Page<ApprovalDocument> findPendingByApproverId(@Param("tenantId") UUID tenantId, @Param("approverId") UUID approverId, Pageable pageable);

    @EntityGraph(value = "ApprovalDocument.withLines", type = EntityGraph.EntityGraphType.LOAD)
    @Query("SELECT d FROM ApprovalDocument d JOIN d.approvalLines l " +
           "WHERE d.tenantId = :tenantId AND l.approverId = :approverId AND l.status IN ('APPROVED', 'REJECTED') " +
           "ORDER BY l.completedAt DESC")
    Page<ApprovalDocument> findProcessedByApproverId(@Param("tenantId") UUID tenantId, @Param("approverId") UUID approverId, Pageable pageable);

    @Query("SELECT COUNT(d) FROM ApprovalDocument d JOIN d.approvalLines l " +
           "WHERE d.tenantId = :tenantId AND l.approverId = :approverId AND l.status = 'ACTIVE'")
    long countPendingByApproverId(@Param("tenantId") UUID tenantId, @Param("approverId") UUID approverId);

    @Query("SELECT MAX(d.documentNumber) FROM ApprovalDocument d WHERE d.tenantId = :tenantId AND d.documentNumber LIKE :prefix%")
    Optional<String> findMaxDocumentNumberByPrefix(@Param("tenantId") UUID tenantId, @Param("prefix") String prefix);

    @EntityGraph(value = "ApprovalDocument.withLines", type = EntityGraph.EntityGraphType.LOAD)
    @Query("SELECT d FROM ApprovalDocument d WHERE d.tenantId = :tenantId " +
           "AND (:status IS NULL OR d.status = :status) " +
           "AND (:type IS NULL OR d.documentType = :type) " +
           "AND (:requesterId IS NULL OR d.drafterId = :requesterId) " +
           "ORDER BY d.createdAt DESC")
    Page<ApprovalDocument> search(
        @Param("tenantId") UUID tenantId,
        @Param("status") ApprovalStatus status,
        @Param("type") String type,
        @Param("requesterId") UUID requesterId,
        Pageable pageable);

    @Query("SELECT COUNT(d) FROM ApprovalDocument d WHERE d.tenantId = :tenantId AND d.status = :status")
    long countByStatus(@Param("tenantId") UUID tenantId, @Param("status") ApprovalStatus status);

    @Query("SELECT COUNT(d) FROM ApprovalDocument d WHERE d.tenantId = :tenantId AND d.drafterId = :drafterId AND d.status = :status")
    long countByDrafterIdAndStatus(@Param("tenantId") UUID tenantId, @Param("drafterId") UUID drafterId, @Param("status") ApprovalStatus status);

    @Query("SELECT d FROM ApprovalDocument d WHERE d.tenantId = :tenantId " +
           "AND d.status IN ('APPROVED', 'REJECTED') " +
           "AND d.completedAt >= :startInstant AND d.completedAt < :endInstant")
    List<ApprovalDocument> findCompletedBetween(@Param("tenantId") UUID tenantId,
                                                 @Param("startInstant") java.time.Instant startInstant,
                                                 @Param("endInstant") java.time.Instant endInstant);

    @Query("SELECT d FROM ApprovalDocument d WHERE d.status = 'IN_PROGRESS' " +
           "AND d.deadlineAt IS NOT NULL AND d.deadlineAt < :now AND d.escalated = false")
    List<ApprovalDocument> findOverdueDocuments(@Param("now") java.time.Instant now);
}
