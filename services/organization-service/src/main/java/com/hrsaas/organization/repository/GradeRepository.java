package com.hrsaas.organization.repository;

import com.hrsaas.organization.domain.entity.Grade;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface GradeRepository extends JpaRepository<Grade, UUID> {

    Optional<Grade> findByCodeAndTenantId(String code, UUID tenantId);

    @Query("SELECT g FROM Grade g WHERE g.tenantId = :tenantId " +
           "ORDER BY g.sortOrder ASC, g.level ASC")
    List<Grade> findAllByTenantId(@Param("tenantId") UUID tenantId);

    @Query("SELECT g FROM Grade g WHERE g.tenantId = :tenantId AND g.isActive = true " +
           "ORDER BY g.sortOrder ASC, g.level ASC")
    List<Grade> findActiveByTenantId(@Param("tenantId") UUID tenantId);

    boolean existsByCodeAndTenantId(String code, UUID tenantId);
}
