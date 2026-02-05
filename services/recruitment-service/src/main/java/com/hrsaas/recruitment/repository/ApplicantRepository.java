package com.hrsaas.recruitment.repository;

import com.hrsaas.recruitment.domain.entity.Applicant;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * 지원자 Repository
 */
@Repository
public interface ApplicantRepository extends JpaRepository<Applicant, UUID> {

    /**
     * 이메일로 지원자 조회
     */
    Optional<Applicant> findByEmail(String email);

    /**
     * 이메일 존재 여부
     */
    boolean existsByEmail(String email);

    /**
     * 이름으로 검색
     */
    Page<Applicant> findByNameContainingIgnoreCaseOrderByCreatedAtDesc(String name, Pageable pageable);

    /**
     * 이름/이메일/전화번호로 검색
     */
    @Query("SELECT a FROM Applicant a WHERE " +
           "LOWER(a.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(a.email) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "a.phone LIKE CONCAT('%', :keyword, '%') " +
           "ORDER BY a.createdAt DESC")
    Page<Applicant> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);

    /**
     * 블랙리스트 지원자 목록
     */
    Page<Applicant> findByBlacklistedTrueOrderByCreatedAtDesc(Pageable pageable);

    /**
     * 소스별 지원자 목록
     */
    Page<Applicant> findBySourceOrderByCreatedAtDesc(String source, Pageable pageable);

    /**
     * 스킬로 지원자 검색
     */
    @Query(value = "SELECT * FROM hr_recruitment.applicant a WHERE " +
           "a.skills @> CAST(:skill AS jsonb) " +
           "ORDER BY a.created_at DESC",
           countQuery = "SELECT COUNT(*) FROM hr_recruitment.applicant a WHERE " +
           "a.skills @> CAST(:skill AS jsonb)",
           nativeQuery = true)
    Page<Applicant> findBySkill(@Param("skill") String skill, Pageable pageable);

    /**
     * 최근 지원한 지원자 목록
     */
    @Query("SELECT DISTINCT a FROM Applicant a " +
           "JOIN a.applications app " +
           "ORDER BY a.createdAt DESC")
    Page<Applicant> findRecentApplicants(Pageable pageable);
}
