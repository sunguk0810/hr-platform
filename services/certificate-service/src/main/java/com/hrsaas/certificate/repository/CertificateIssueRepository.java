package com.hrsaas.certificate.repository;

import com.hrsaas.certificate.domain.entity.CertificateIssue;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * 발급된 증명서 Repository
 */
@Repository
public interface CertificateIssueRepository extends JpaRepository<CertificateIssue, UUID> {

    /**
     * 발급번호로 조회
     */
    Optional<CertificateIssue> findByIssueNumber(String issueNumber);

    /**
     * 진위확인 코드로 조회
     */
    Optional<CertificateIssue> findByVerificationCode(String verificationCode);

    /**
     * 신청 ID로 발급 증명서 목록 조회
     */
    List<CertificateIssue> findByRequestIdOrderByIssuedAtDesc(UUID requestId);

    /**
     * 발급자별 발급 목록
     */
    Page<CertificateIssue> findByIssuedByOrderByIssuedAtDesc(UUID issuedBy, Pageable pageable);

    /**
     * 기간별 발급 목록
     */
    @Query("SELECT ci FROM CertificateIssue ci WHERE " +
           "ci.issuedAt BETWEEN :startDate AND :endDate " +
           "ORDER BY ci.issuedAt DESC")
    Page<CertificateIssue> findByIssuedDateRange(
            @Param("startDate") Instant startDate,
            @Param("endDate") Instant endDate,
            Pageable pageable);

    /**
     * 만료 예정 증명서 목록
     */
    @Query("SELECT ci FROM CertificateIssue ci WHERE " +
           "ci.expiresAt <= :expiresDate AND " +
           "ci.revoked = false")
    List<CertificateIssue> findExpiringSoon(@Param("expiresDate") LocalDate expiresDate);

    /**
     * 만료된 증명서 목록
     */
    @Query("SELECT ci FROM CertificateIssue ci WHERE " +
           "ci.expiresAt < :today AND " +
           "ci.revoked = false")
    List<CertificateIssue> findExpired(@Param("today") LocalDate today);

    /**
     * 취소된 증명서 목록
     */
    Page<CertificateIssue> findByRevokedTrueOrderByRevokedAtDesc(Pageable pageable);

    /**
     * 유효한 증명서 목록
     */
    @Query("SELECT ci FROM CertificateIssue ci WHERE " +
           "ci.revoked = false AND " +
           "ci.expiresAt >= :today " +
           "ORDER BY ci.issuedAt DESC")
    Page<CertificateIssue> findValidCertificates(@Param("today") LocalDate today, Pageable pageable);

    /**
     * 다운로드된 적 없는 증명서 목록
     */
    List<CertificateIssue> findByDownloadedAtIsNullAndRevokedFalse();

    /**
     * 진위확인된 증명서 목록
     */
    @Query("SELECT ci FROM CertificateIssue ci WHERE " +
           "ci.verifiedCount > 0 " +
           "ORDER BY ci.lastVerifiedAt DESC")
    Page<CertificateIssue> findVerifiedCertificates(Pageable pageable);

    /**
     * 발급번호 존재 여부
     */
    boolean existsByIssueNumber(String issueNumber);

    /**
     * 진위확인 코드 존재 여부
     */
    boolean existsByVerificationCode(String verificationCode);

    /**
     * 기간별 발급 건수
     */
    @Query("SELECT COUNT(ci) FROM CertificateIssue ci WHERE " +
           "ci.issuedAt BETWEEN :startDate AND :endDate")
    long countByIssuedDateRange(
            @Param("startDate") Instant startDate,
            @Param("endDate") Instant endDate);

    /**
     * 취소자별 취소된 증명서 목록
     */
    Page<CertificateIssue> findByRevokedByOrderByRevokedAtDesc(UUID revokedBy, Pageable pageable);

    /**
     * 파일 ID로 증명서 조회
     */
    Optional<CertificateIssue> findByFileId(UUID fileId);

    /**
     * 직원별 발급 증명서 목록 (신청을 통해)
     */
    @Query("SELECT ci FROM CertificateIssue ci " +
           "JOIN FETCH ci.request cr WHERE " +
           "cr.employeeId = :employeeId " +
           "ORDER BY ci.issuedAt DESC")
    Page<CertificateIssue> findByEmployeeId(@Param("employeeId") UUID employeeId, Pageable pageable);

    /**
     * 직원별 발급 증명서 목록 (타입/만료 필터)
     */
    @Query("SELECT ci FROM CertificateIssue ci " +
           "JOIN FETCH ci.request cr WHERE " +
           "cr.employeeId = :employeeId " +
           "AND (:typeCode IS NULL OR cr.certificateType.code = :typeCode) " +
           "AND (:includeExpired = true OR ci.expiresAt >= :today) " +
           "ORDER BY ci.issuedAt DESC")
    Page<CertificateIssue> findByEmployeeIdWithFilter(
            @Param("employeeId") UUID employeeId,
            @Param("typeCode") String typeCode,
            @Param("includeExpired") boolean includeExpired,
            @Param("today") java.time.LocalDate today,
            Pageable pageable);

    /**
     * 특정 프리픽스를 가진 최신 발급번호 조회 (길이 및 값 기준 내림차순)
     */
    @Query("SELECT ci.issueNumber FROM CertificateIssue ci WHERE ci.tenantId = :tenantId AND ci.issueNumber LIKE :prefix% ORDER BY LENGTH(ci.issueNumber) DESC, ci.issueNumber DESC")
    List<String> findLatestIssueNumbers(@Param("tenantId") UUID tenantId, @Param("prefix") String prefix, Pageable pageable);
}
