package com.hrsaas.mdm.repository;

import com.hrsaas.mdm.domain.entity.CodeTenantMapping;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CodeTenantMappingRepository extends JpaRepository<CodeTenantMapping, UUID> {

    @Query("SELECT m FROM CodeTenantMapping m WHERE m.tenantId = :tenantId AND m.commonCode.id = :codeId")
    Optional<CodeTenantMapping> findByTenantIdAndCodeId(
        @Param("tenantId") UUID tenantId,
        @Param("codeId") UUID codeId);

    @Query("SELECT m FROM CodeTenantMapping m " +
           "JOIN m.commonCode c " +
           "WHERE m.tenantId = :tenantId AND c.codeGroup.groupCode = :groupCode " +
           "ORDER BY COALESCE(m.customSortOrder, c.sortOrder) ASC")
    List<CodeTenantMapping> findByTenantIdAndGroupCode(
        @Param("tenantId") UUID tenantId,
        @Param("groupCode") String groupCode);

    @Query("SELECT m FROM CodeTenantMapping m WHERE m.tenantId = :tenantId AND m.active = true")
    List<CodeTenantMapping> findActiveByTenantId(@Param("tenantId") UUID tenantId);

    @Query("SELECT m FROM CodeTenantMapping m WHERE m.tenantId = :tenantId AND m.hidden = false AND m.active = true")
    List<CodeTenantMapping> findVisibleByTenantId(@Param("tenantId") UUID tenantId);

    @Query("SELECT m FROM CodeTenantMapping m " +
           "JOIN m.commonCode c " +
           "WHERE m.tenantId = :tenantId AND c.codeGroup.groupCode = :groupCode AND m.hidden = false AND m.active = true " +
           "ORDER BY COALESCE(m.customSortOrder, c.sortOrder) ASC")
    List<CodeTenantMapping> findVisibleByTenantIdAndGroupCode(
        @Param("tenantId") UUID tenantId,
        @Param("groupCode") String groupCode);

    boolean existsByTenantIdAndCommonCodeId(UUID tenantId, UUID commonCodeId);

    void deleteByTenantIdAndCommonCodeId(UUID tenantId, UUID commonCodeId);
}
