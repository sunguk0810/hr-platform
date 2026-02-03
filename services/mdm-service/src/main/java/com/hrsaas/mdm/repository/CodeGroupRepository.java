package com.hrsaas.mdm.repository;

import com.hrsaas.mdm.domain.entity.CodeGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CodeGroupRepository extends JpaRepository<CodeGroup, UUID> {

    @Query("SELECT cg FROM CodeGroup cg WHERE cg.groupCode = :groupCode " +
           "AND (cg.tenantId IS NULL OR cg.tenantId = :tenantId)")
    Optional<CodeGroup> findByGroupCodeAndTenant(
        @Param("groupCode") String groupCode,
        @Param("tenantId") UUID tenantId);

    @Query("SELECT cg FROM CodeGroup cg WHERE cg.groupCode = :groupCode AND cg.tenantId IS NULL")
    Optional<CodeGroup> findSystemCodeGroup(@Param("groupCode") String groupCode);

    @Query("SELECT cg FROM CodeGroup cg WHERE cg.tenantId IS NULL OR cg.tenantId = :tenantId " +
           "ORDER BY cg.sortOrder ASC")
    List<CodeGroup> findAllForTenant(@Param("tenantId") UUID tenantId);

    @Query("SELECT cg FROM CodeGroup cg WHERE cg.tenantId IS NULL ORDER BY cg.sortOrder ASC")
    List<CodeGroup> findAllSystemCodeGroups();

    boolean existsByGroupCodeAndTenantId(String groupCode, UUID tenantId);
}
