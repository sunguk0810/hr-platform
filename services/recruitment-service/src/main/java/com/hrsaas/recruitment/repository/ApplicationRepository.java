package com.hrsaas.recruitment.repository;

import com.hrsaas.recruitment.domain.entity.Application;
import com.hrsaas.recruitment.domain.entity.ApplicationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * 지원서 Repository
 */
@Repository
public interface ApplicationRepository extends JpaRepository<Application, UUID> {

    /**
     * 지원번호로 조회
     */
    Optional<Application> findByApplicationNumber(String applicationNumber);

    /**
     * 채용공고별 지원서 목록
     */
    Page<Application> findByJobPostingIdOrderByCreatedAtDesc(UUID jobPostingId, Pageable pageable);

    /**
     * 채용공고별 상태별 지원서 목록
     */
    Page<Application> findByJobPostingIdAndStatusOrderByCreatedAtDesc(
            UUID jobPostingId, ApplicationStatus status, Pageable pageable);

    /**
     * 지원자별 지원서 목록
     */
    Page<Application> findByApplicantIdOrderByCreatedAtDesc(UUID applicantId, Pageable pageable);

    /**
     * 상태별 지원서 목록
     */
    Page<Application> findByStatusOrderByCreatedAtDesc(ApplicationStatus status, Pageable pageable);

    /**
     * 현재 단계별 지원서 목록
     */
    Page<Application> findByCurrentStageOrderByCreatedAtDesc(String currentStage, Pageable pageable);

    /**
     * 중복 지원 확인
     */
    boolean existsByJobPostingIdAndApplicantId(UUID jobPostingId, UUID applicantId);

    /**
     * 기간별 지원서 목록
     */
    @Query("SELECT a FROM Application a WHERE " +
           "a.createdAt BETWEEN :startDate AND :endDate " +
           "ORDER BY a.createdAt DESC")
    Page<Application> findByDateRange(@Param("startDate") Instant startDate,
                                       @Param("endDate") Instant endDate,
                                       Pageable pageable);

    /**
     * 추천인별 지원서 목록
     */
    Page<Application> findByReferrerEmployeeIdOrderByCreatedAtDesc(UUID referrerEmployeeId, Pageable pageable);

    /**
     * 상태별 지원서 수
     */
    long countByStatus(ApplicationStatus status);

    /**
     * 채용공고별 지원서 수
     */
    long countByJobPostingId(UUID jobPostingId);

    /**
     * 채용공고별 상태별 지원서 수
     */
    long countByJobPostingIdAndStatus(UUID jobPostingId, ApplicationStatus status);

    /**
     * 지원번호 존재 여부
     */
    boolean existsByApplicationNumber(String applicationNumber);

    /**
     * 서류 심사 대기중인 지원서
     */
    List<Application> findByStatusAndScreenedAtIsNull(ApplicationStatus status);

    /**
     * 채용 완료된 지원서
     */
    @Query("SELECT a FROM Application a WHERE a.status = 'HIRED' " +
           "AND a.hiredAt BETWEEN :startDate AND :endDate")
    List<Application> findHiredApplicationsByDateRange(@Param("startDate") Instant startDate,
                                                        @Param("endDate") Instant endDate);

    /**
     * 채용공고별 단계별 지원서 집계
     */
    @Query("SELECT a.currentStage, COUNT(a) FROM Application a " +
           "WHERE a.jobPosting.id = :jobPostingId AND a.currentStage IS NOT NULL " +
           "GROUP BY a.currentStage")
    List<Object[]> countByJobPostingIdGroupByCurrentStage(@Param("jobPostingId") UUID jobPostingId);

    /**
     * 상태별 지원서 수 GROUP BY 집계 (getSummary N+1 해결용).
     * 10개 개별 COUNT 쿼리를 1개 GROUP BY 쿼리로 통합.
     */
    @Query("SELECT a.status, COUNT(a) FROM Application a GROUP BY a.status")
    List<Object[]> countGroupByStatus();
}
