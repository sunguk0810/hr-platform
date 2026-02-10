package com.hrsaas.auth.repository;

import com.hrsaas.auth.domain.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.UUID;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {

    @Query("SELECT a FROM AuditLog a WHERE a.tenantId = :tenantId ORDER BY a.createdAt DESC")
    Page<AuditLog> findByTenantId(@Param("tenantId") UUID tenantId, Pageable pageable);

    @Query("SELECT a FROM AuditLog a WHERE a.tenantId = :tenantId AND a.actorId = :actorId ORDER BY a.createdAt DESC")
    Page<AuditLog> findByTenantIdAndActorId(@Param("tenantId") UUID tenantId, @Param("actorId") String actorId, Pageable pageable);

    @Query("SELECT a FROM AuditLog a WHERE a.tenantId = :tenantId AND a.action = :action ORDER BY a.createdAt DESC")
    Page<AuditLog> findByTenantIdAndAction(@Param("tenantId") UUID tenantId, @Param("action") String action, Pageable pageable);

    @Query("SELECT a FROM AuditLog a WHERE a.tenantId = :tenantId " +
           "AND a.createdAt >= :from AND a.createdAt < :to ORDER BY a.createdAt DESC")
    Page<AuditLog> findByTenantIdAndDateRange(@Param("tenantId") UUID tenantId,
                                                @Param("from") OffsetDateTime from,
                                                @Param("to") OffsetDateTime to,
                                                Pageable pageable);
}
