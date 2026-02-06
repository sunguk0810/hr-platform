package com.hrsaas.approval.repository;

import com.hrsaas.approval.domain.entity.ConditionalRoute;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ConditionalRouteRepository extends JpaRepository<ConditionalRoute, UUID> {

    @Query("SELECT r FROM ConditionalRoute r WHERE r.tenantId = :tenantId " +
           "AND r.templateId = :templateId AND r.isActive = true ORDER BY r.priority ASC")
    List<ConditionalRoute> findActiveRoutes(
        @Param("tenantId") UUID tenantId,
        @Param("templateId") UUID templateId);

    @Query("SELECT r FROM ConditionalRoute r WHERE r.tenantId = :tenantId ORDER BY r.createdAt DESC")
    List<ConditionalRoute> findAllByTenantId(@Param("tenantId") UUID tenantId);
}
