package com.hrsaas.certificate.repository;

import com.hrsaas.certificate.domain.entity.CertificateTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * 증명서 템플릿 Repository
 */
@Repository
public interface CertificateTemplateRepository extends JpaRepository<CertificateTemplate, UUID> {

    /**
     * 이름으로 템플릿 조회
     */
    Optional<CertificateTemplate> findByName(String name);

    /**
     * 활성화된 템플릿 목록 조회
     */
    List<CertificateTemplate> findByActiveTrueOrderByNameAsc();

    /**
     * 이름 존재 여부 확인
     */
    boolean existsByName(String name);

    /**
     * 이름으로 검색 (활성화된 것만)
     */
    @Query("SELECT ct FROM CertificateTemplate ct WHERE " +
           "LOWER(ct.name) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "AND ct.active = true ORDER BY ct.name ASC")
    List<CertificateTemplate> searchByName(@Param("keyword") String keyword);

    /**
     * 페이지 크기별 템플릿 조회
     */
    List<CertificateTemplate> findByPageSizeAndActiveTrue(String pageSize);

    /**
     * 회사 직인 포함 템플릿 조회
     */
    List<CertificateTemplate> findByIncludeCompanySealTrueAndActiveTrue();
}
