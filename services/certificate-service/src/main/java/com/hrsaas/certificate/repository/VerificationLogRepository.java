package com.hrsaas.certificate.repository;

import com.hrsaas.certificate.domain.entity.VerificationLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * 진위확인 로그 Repository
 */
@Repository
public interface VerificationLogRepository extends JpaRepository<VerificationLog, UUID> {

    /**
     * 발급 증명서별 진위확인 로그
     */
    Page<VerificationLog> findByIssueIdOrderByVerifiedAtDesc(UUID issueId, Pageable pageable);

    /**
     * 진위확인 코드별 로그
     */
    List<VerificationLog> findByVerificationCodeOrderByVerifiedAtDesc(String verificationCode);

    /**
     * 기간별 진위확인 로그
     */
    @Query("SELECT vl FROM VerificationLog vl WHERE " +
           "vl.verifiedAt BETWEEN :startDate AND :endDate " +
           "ORDER BY vl.verifiedAt DESC")
    Page<VerificationLog> findByDateRange(
            @Param("startDate") Instant startDate,
            @Param("endDate") Instant endDate,
            Pageable pageable);

    /**
     * IP별 진위확인 로그
     */
    List<VerificationLog> findByVerifierIpOrderByVerifiedAtDesc(String verifierIp);

    /**
     * 실패한 진위확인 로그
     */
    Page<VerificationLog> findByValidFalseOrderByVerifiedAtDesc(Pageable pageable);

    /**
     * 성공한 진위확인 로그
     */
    Page<VerificationLog> findByValidTrueOrderByVerifiedAtDesc(Pageable pageable);

    /**
     * 기관별 진위확인 로그
     */
    Page<VerificationLog> findByVerifierOrganizationOrderByVerifiedAtDesc(
            String verifierOrganization, Pageable pageable);

    /**
     * 기간별 진위확인 건수
     */
    @Query("SELECT COUNT(vl) FROM VerificationLog vl WHERE " +
           "vl.verifiedAt BETWEEN :startDate AND :endDate")
    long countByDateRange(
            @Param("startDate") Instant startDate,
            @Param("endDate") Instant endDate);

    /**
     * 기간별 성공/실패 건수
     */
    @Query("SELECT COUNT(vl) FROM VerificationLog vl WHERE " +
           "vl.verifiedAt BETWEEN :startDate AND :endDate AND " +
           "vl.valid = :isValid")
    long countByDateRangeAndValidity(
            @Param("startDate") Instant startDate,
            @Param("endDate") Instant endDate,
            @Param("isValid") boolean isValid);

    /**
     * 발급 증명서별 진위확인 건수
     */
    long countByIssueId(UUID issueId);

    /**
     * 특정 IP에서 기간 내 확인 건수 (악용 방지용)
     */
    @Query("SELECT COUNT(vl) FROM VerificationLog vl WHERE " +
           "vl.verifierIp = :ip AND " +
           "vl.verifiedAt >= :since")
    long countByIpSince(@Param("ip") String ip, @Param("since") Instant since);

    /**
     * 실패 사유별 통계
     */
    @Query("SELECT vl.failureReason, COUNT(vl) FROM VerificationLog vl " +
           "WHERE vl.valid = false " +
           "GROUP BY vl.failureReason")
    List<Object[]> countByFailureReason();

    /**
     * 기관별 진위확인 통계
     */
    @Query("SELECT vl.verifierOrganization, COUNT(vl) FROM VerificationLog vl " +
           "WHERE vl.verifierOrganization IS NOT NULL " +
           "GROUP BY vl.verifierOrganization " +
           "ORDER BY COUNT(vl) DESC")
    List<Object[]> countByOrganization();
}
