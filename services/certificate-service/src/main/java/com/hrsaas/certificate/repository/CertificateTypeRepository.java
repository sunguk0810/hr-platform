package com.hrsaas.certificate.repository;

import com.hrsaas.certificate.domain.entity.CertificateType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * 증명서 유형 Repository
 */
@Repository
public interface CertificateTypeRepository extends JpaRepository<CertificateType, UUID> {

    /**
     * 코드로 증명서 유형 조회
     */
    Optional<CertificateType> findByCode(String code);

    /**
     * 활성화된 증명서 유형 목록 조회
     */
    List<CertificateType> findByActiveTrueOrderBySortOrderAsc();

    /**
     * 코드 존재 여부 확인
     */
    boolean existsByCode(String code);

    /**
     * 자동 발급 가능한 증명서 유형 목록
     */
    List<CertificateType> findByAutoIssueTrueAndActiveTrue();

    /**
     * 결재 필요 증명서 유형 목록
     */
    List<CertificateType> findByRequiresApprovalTrueAndActiveTrue();

    /**
     * 템플릿 ID로 증명서 유형 조회
     */
    List<CertificateType> findByTemplateId(UUID templateId);

    /**
     * 이름으로 검색
     */
    @Query("SELECT ct FROM CertificateType ct WHERE " +
           "(LOWER(ct.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(ct.nameEn) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "AND ct.active = true ORDER BY ct.sortOrder ASC")
    List<CertificateType> searchByName(@Param("keyword") String keyword);
}
