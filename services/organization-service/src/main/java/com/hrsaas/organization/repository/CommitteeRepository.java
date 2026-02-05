package com.hrsaas.organization.repository;

import com.hrsaas.organization.domain.entity.Committee;
import com.hrsaas.organization.domain.entity.CommitteeStatus;
import com.hrsaas.organization.domain.entity.CommitteeType;
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
public interface CommitteeRepository extends JpaRepository<Committee, UUID> {

    Optional<Committee> findByCodeAndTenantId(String code, UUID tenantId);

    Optional<Committee> findByIdAndTenantId(UUID id, UUID tenantId);

    @Query("SELECT c FROM Committee c WHERE c.tenantId = :tenantId " +
           "ORDER BY c.status ASC, c.name ASC")
    List<Committee> findAllByTenantId(@Param("tenantId") UUID tenantId);

    @Query("SELECT c FROM Committee c WHERE c.tenantId = :tenantId " +
           "ORDER BY c.status ASC, c.name ASC")
    Page<Committee> findAllByTenantId(@Param("tenantId") UUID tenantId, Pageable pageable);

    @Query("SELECT c FROM Committee c WHERE c.tenantId = :tenantId AND c.status = :status " +
           "ORDER BY c.name ASC")
    List<Committee> findByTenantIdAndStatus(
        @Param("tenantId") UUID tenantId,
        @Param("status") CommitteeStatus status);

    @Query("SELECT c FROM Committee c WHERE c.tenantId = :tenantId AND c.type = :type " +
           "ORDER BY c.status ASC, c.name ASC")
    List<Committee> findByTenantIdAndType(
        @Param("tenantId") UUID tenantId,
        @Param("type") CommitteeType type);

    @Query("SELECT c FROM Committee c WHERE c.tenantId = :tenantId AND c.status = :status AND c.type = :type " +
           "ORDER BY c.name ASC")
    List<Committee> findByTenantIdAndStatusAndType(
        @Param("tenantId") UUID tenantId,
        @Param("status") CommitteeStatus status,
        @Param("type") CommitteeType type);

    boolean existsByCodeAndTenantId(String code, UUID tenantId);
}
