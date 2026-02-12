package com.hrsaas.employee.repository;

import com.hrsaas.employee.domain.entity.TransferRequest;
import com.hrsaas.employee.domain.entity.TransferStatus;
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
public interface TransferRequestRepository extends JpaRepository<TransferRequest, UUID> {

    Optional<TransferRequest> findByIdAndTenantId(UUID id, UUID tenantId);

    @Query("""
        SELECT t FROM TransferRequest t
        WHERE t.id = :id
          AND (t.tenantId = :tenantId OR t.sourceTenantId = :tenantId OR t.targetTenantId = :tenantId)
        """)
    Optional<TransferRequest> findByIdAndRelatedTenantId(@Param("id") UUID id, @Param("tenantId") UUID tenantId);

    @Query("SELECT t FROM TransferRequest t WHERE t.tenantId = :tenantId OR t.sourceTenantId = :tenantId OR t.targetTenantId = :tenantId")
    Page<TransferRequest> findAllByRelatedTenantId(@Param("tenantId") UUID tenantId, Pageable pageable);

    @Query("SELECT t FROM TransferRequest t WHERE (t.tenantId = :tenantId OR t.sourceTenantId = :tenantId OR t.targetTenantId = :tenantId) AND t.status = :status")
    List<TransferRequest> findByRelatedTenantIdAndStatus(@Param("tenantId") UUID tenantId, @Param("status") TransferStatus status);

    List<TransferRequest> findByEmployeeId(UUID employeeId);

    @Query("SELECT COUNT(t) FROM TransferRequest t WHERE t.sourceTenantId = :tenantId AND t.status = :status")
    long countPendingOutgoingByTenantId(@Param("tenantId") UUID tenantId, @Param("status") TransferStatus status);

    @Query("SELECT COUNT(t) FROM TransferRequest t WHERE t.targetTenantId = :tenantId AND t.status = :status")
    long countPendingIncomingByTenantId(@Param("tenantId") UUID tenantId, @Param("status") TransferStatus status);
}
