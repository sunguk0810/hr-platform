package com.hrsaas.mdm.repository;

import com.hrsaas.mdm.domain.entity.CodeStatus;
import com.hrsaas.mdm.domain.entity.CommonCode;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
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

    @Query("SELECT cc FROM CommonCode cc WHERE cc.codeGroup.id IN :codeGroupIds " +
           "AND cc.active = true ORDER BY cc.codeGroup.id, cc.sortOrder ASC")
    List<CommonCode> findByCodeGroupIdIn(@Param("codeGroupIds") List<UUID> codeGroupIds);

    boolean existsByCodeGroupIdAndCodeAndTenantId(UUID codeGroupId, String code, UUID tenantId);

    @Query("SELECT cc FROM CommonCode cc WHERE (cc.tenantId IS NULL OR cc.tenantId = :tenantId) " +
           "ORDER BY cc.codeGroup.groupCode ASC, cc.sortOrder ASC")
    List<CommonCode> findAllByTenantId(@Param("tenantId") UUID tenantId);

    @Query("SELECT cc FROM CommonCode cc WHERE (cc.tenantId IS NULL OR cc.tenantId = :tenantId) " +
           "AND cc.active = true " +
           "ORDER BY cc.codeGroup.groupCode ASC, cc.sortOrder ASC")
    List<CommonCode> findActiveByTenantId(@Param("tenantId") UUID tenantId);

    @Query("SELECT cc FROM CommonCode cc WHERE cc.codeGroup.groupCode = :groupCode " +
           "AND (cc.tenantId IS NULL OR cc.tenantId = :tenantId) " +
           "AND LOWER(cc.codeName) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "ORDER BY cc.sortOrder ASC")
    List<CommonCode> searchByCodeName(
        @Param("groupCode") String groupCode,
        @Param("keyword") String keyword,
        @Param("tenantId") UUID tenantId);

    @Query("SELECT cc FROM CommonCode cc WHERE (cc.tenantId IS NULL OR cc.tenantId = :tenantId) " +
           "AND (:groupCode IS NULL OR cc.codeGroup.groupCode = :groupCode) " +
           "AND (:status IS NULL OR cc.status = :status) " +
           "ORDER BY cc.codeGroup.groupCode ASC, cc.sortOrder ASC")
    Page<CommonCode> findAllNoKeyword(
        @Param("tenantId") UUID tenantId,
        @Param("groupCode") String groupCode,
        @Param("status") CodeStatus status,
        Pageable pageable);

    @Query("SELECT cc FROM CommonCode cc WHERE (cc.tenantId IS NULL OR cc.tenantId = :tenantId) " +
           "AND (LOWER(cc.codeName) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "    OR LOWER(cc.code) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "AND (:groupCode IS NULL OR cc.codeGroup.groupCode = :groupCode) " +
           "AND (:status IS NULL OR cc.status = :status) " +
           "ORDER BY cc.codeGroup.groupCode ASC, cc.sortOrder ASC")
    Page<CommonCode> findAllWithKeyword(
        @Param("tenantId") UUID tenantId,
        @Param("keyword") String keyword,
        @Param("groupCode") String groupCode,
        @Param("status") CodeStatus status,
        Pageable pageable);

    /**
     * G04: 폐기된 코드 중 deprecatedAt이 있는 코드 조회
     */
    @Query("SELECT cc FROM CommonCode cc JOIN FETCH cc.codeGroup WHERE cc.status = 'DEPRECATED' AND cc.deprecatedAt IS NOT NULL")
    List<CommonCode> findAllDeprecatedWithTimestamp();

    /**
     * G09: 유효기간 시작일이 오늘 이전이고 비활성인 코드 (활성화 대상)
     */
    @Query("SELECT cc FROM CommonCode cc WHERE cc.effectiveFrom <= :today AND cc.active = false " +
           "AND cc.status != 'DEPRECATED' AND cc.effectiveFrom IS NOT NULL")
    List<CommonCode> findCodesBecomingEffective(@Param("today") LocalDate today);

    /**
     * G09: 유효기간 종료일이 오늘 이전이고 활성인 코드 (비활성화 대상)
     */
    @Query("SELECT cc FROM CommonCode cc WHERE cc.effectiveTo < :today AND cc.active = true " +
           "AND cc.effectiveTo IS NOT NULL")
    List<CommonCode> findExpiredCodes(@Param("today") LocalDate today);
}
