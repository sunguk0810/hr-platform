package com.hrsaas.organization.repository;

import com.hrsaas.organization.domain.entity.Position;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PositionRepository extends JpaRepository<Position, UUID> {

    Optional<Position> findByCodeAndTenantId(String code, UUID tenantId);

    @Query("SELECT p FROM Position p WHERE p.tenantId = :tenantId " +
           "ORDER BY p.sortOrder ASC, p.level ASC")
    List<Position> findAllByTenantId(@Param("tenantId") UUID tenantId);

    @Query("SELECT p FROM Position p WHERE p.tenantId = :tenantId AND p.isActive = true " +
           "ORDER BY p.sortOrder ASC, p.level ASC")
    List<Position> findActiveByTenantId(@Param("tenantId") UUID tenantId);

    boolean existsByCodeAndTenantId(String code, UUID tenantId);
}
