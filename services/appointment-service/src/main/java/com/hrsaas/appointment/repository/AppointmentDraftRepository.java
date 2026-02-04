package com.hrsaas.appointment.repository;

import com.hrsaas.appointment.domain.entity.AppointmentDraft;
import com.hrsaas.appointment.domain.entity.DraftStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AppointmentDraftRepository extends JpaRepository<AppointmentDraft, UUID> {

    @Query("SELECT d FROM AppointmentDraft d WHERE d.tenantId = :tenantId " +
           "ORDER BY d.createdAt DESC")
    Page<AppointmentDraft> findByTenantId(
        @Param("tenantId") UUID tenantId,
        Pageable pageable);

    @Query("SELECT d FROM AppointmentDraft d WHERE d.tenantId = :tenantId " +
           "AND d.status = :status ORDER BY d.createdAt DESC")
    Page<AppointmentDraft> findByTenantIdAndStatus(
        @Param("tenantId") UUID tenantId,
        @Param("status") DraftStatus status,
        Pageable pageable);

    @Query("SELECT d FROM AppointmentDraft d WHERE d.tenantId = :tenantId " +
           "AND d.effectiveDate BETWEEN :startDate AND :endDate " +
           "ORDER BY d.effectiveDate ASC")
    Page<AppointmentDraft> findByTenantIdAndEffectiveDateBetween(
        @Param("tenantId") UUID tenantId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate,
        Pageable pageable);

    @Query("SELECT d FROM AppointmentDraft d WHERE d.tenantId = :tenantId " +
           "AND d.draftNumber = :draftNumber")
    Optional<AppointmentDraft> findByTenantIdAndDraftNumber(
        @Param("tenantId") UUID tenantId,
        @Param("draftNumber") String draftNumber);

    Optional<AppointmentDraft> findByApprovalId(UUID approvalId);

    boolean existsByTenantIdAndDraftNumber(UUID tenantId, String draftNumber);

    @Query("SELECT MAX(CAST(SUBSTRING(d.draftNumber, 5, 4) AS int)) FROM AppointmentDraft d " +
           "WHERE d.tenantId = :tenantId AND d.draftNumber LIKE :prefix%")
    Integer findMaxDraftNumberByPrefix(
        @Param("tenantId") UUID tenantId,
        @Param("prefix") String prefix);
}
