package com.hrsaas.employee.repository;

import com.hrsaas.employee.domain.entity.CondolenceEventType;
import com.hrsaas.employee.domain.entity.CondolenceRequest;
import com.hrsaas.employee.domain.entity.CondolenceStatus;
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
public interface CondolenceRequestRepository extends JpaRepository<CondolenceRequest, UUID> {

    @Query("SELECT r FROM CondolenceRequest r WHERE r.tenantId = :tenantId " +
           "ORDER BY r.createdAt DESC")
    Page<CondolenceRequest> findAllByTenantId(
        @Param("tenantId") UUID tenantId,
        Pageable pageable);

    Optional<CondolenceRequest> findByIdAndTenantId(UUID id, UUID tenantId);

    @Query("SELECT r FROM CondolenceRequest r WHERE r.tenantId = :tenantId AND r.employeeId = :employeeId " +
           "ORDER BY r.createdAt DESC")
    List<CondolenceRequest> findByTenantIdAndEmployeeId(
        @Param("tenantId") UUID tenantId,
        @Param("employeeId") UUID employeeId);

    @Query("SELECT r FROM CondolenceRequest r WHERE r.tenantId = :tenantId AND r.status = :status " +
           "ORDER BY r.createdAt DESC")
    List<CondolenceRequest> findByTenantIdAndStatus(
        @Param("tenantId") UUID tenantId,
        @Param("status") CondolenceStatus status);

    @Query("SELECT r FROM CondolenceRequest r WHERE r.tenantId = :tenantId AND r.eventType = :eventType " +
           "ORDER BY r.createdAt DESC")
    List<CondolenceRequest> findByTenantIdAndEventType(
        @Param("tenantId") UUID tenantId,
        @Param("eventType") CondolenceEventType eventType);

    @Query("SELECT COUNT(r) FROM CondolenceRequest r WHERE r.tenantId = :tenantId AND r.status = :status")
    long countByTenantIdAndStatus(
        @Param("tenantId") UUID tenantId,
        @Param("status") CondolenceStatus status);

    /**
     * 미지급 승인건 조회 (지급 대기)
     */
    @Query("SELECT r FROM CondolenceRequest r WHERE r.tenantId = :tenantId " +
           "AND r.status = 'APPROVED' AND r.paidDate IS NULL " +
           "ORDER BY r.createdAt DESC")
    Page<CondolenceRequest> findPendingPayments(
        @Param("tenantId") UUID tenantId,
        Pageable pageable);

    /**
     * 지급 완료 이력 조회
     */
    @Query("SELECT r FROM CondolenceRequest r WHERE r.tenantId = :tenantId " +
           "AND r.status = 'PAID' " +
           "ORDER BY r.paidDate DESC")
    Page<CondolenceRequest> findPaymentHistory(
        @Param("tenantId") UUID tenantId,
        Pageable pageable);
}
