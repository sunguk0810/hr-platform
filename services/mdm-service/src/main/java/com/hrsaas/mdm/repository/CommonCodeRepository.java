package com.hrsaas.mdm.repository;

import com.hrsaas.mdm.domain.entity.CommonCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CommonCodeRepository extends JpaRepository<CommonCode, UUID> {

    @Query("SELECT cc FROM CommonCode cc WHERE cc.codeGroup.groupCode = :groupCode " +
           "AND cc.code = :code AND (cc.tenantId IS NULL OR cc.tenantId = :tenantId) " +
           "AND cc.active = true")
    Optional<CommonCode> findByGroupAndCode(
        @Param("groupCode") String groupCode,
        @Param("code") String code,
        @Param("tenantId") UUID tenantId);

    @Query("SELECT cc FROM CommonCode cc WHERE cc.codeGroup.groupCode = :groupCode " +
           "AND (cc.tenantId IS NULL OR cc.tenantId = :tenantId) AND cc.active = true " +
           "ORDER BY cc.sortOrder ASC")
    List<CommonCode> findByGroupCode(
        @Param("groupCode") String groupCode,
        @Param("tenantId") UUID tenantId);

    @Query("SELECT cc FROM CommonCode cc WHERE cc.codeGroup.id = :codeGroupId " +
           "AND cc.active = true ORDER BY cc.sortOrder ASC")
    List<CommonCode> findByCodeGroupId(@Param("codeGroupId") UUID codeGroupId);

    boolean existsByCodeGroupIdAndCodeAndTenantId(UUID codeGroupId, String code, UUID tenantId);
}
