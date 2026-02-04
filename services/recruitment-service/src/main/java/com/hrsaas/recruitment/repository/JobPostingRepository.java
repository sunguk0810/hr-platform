package com.hrsaas.recruitment.repository;

import com.hrsaas.recruitment.domain.entity.EmploymentType;
import com.hrsaas.recruitment.domain.entity.JobPosting;
import com.hrsaas.recruitment.domain.entity.JobStatus;
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

/**
 * 채용공고 Repository
 */
@Repository
public interface JobPostingRepository extends JpaRepository<JobPosting, UUID> {

    /**
     * 채용 코드로 조회
     */
    Optional<JobPosting> findByJobCode(String jobCode);

    /**
     * 상태별 채용공고 목록
     */
    Page<JobPosting> findByStatusOrderByCreatedAtDesc(JobStatus status, Pageable pageable);

    /**
     * 게시중인 채용공고 목록
     */
    @Query("SELECT j FROM JobPosting j WHERE j.status = 'PUBLISHED' " +
           "AND (j.closeDate IS NULL OR j.closeDate >= :today) " +
           "ORDER BY j.featured DESC, j.urgent DESC, j.createdAt DESC")
    Page<JobPosting> findActiveJobPostings(@Param("today") LocalDate today, Pageable pageable);

    /**
     * 부서별 채용공고 목록
     */
    Page<JobPosting> findByDepartmentIdOrderByCreatedAtDesc(UUID departmentId, Pageable pageable);

    /**
     * 담당자별 채용공고 목록
     */
    Page<JobPosting> findByRecruiterIdOrderByCreatedAtDesc(UUID recruiterId, Pageable pageable);

    /**
     * 채용 관리자별 채용공고 목록
     */
    Page<JobPosting> findByHiringManagerIdOrderByCreatedAtDesc(UUID hiringManagerId, Pageable pageable);

    /**
     * 고용 형태별 채용공고 목록
     */
    Page<JobPosting> findByEmploymentTypeAndStatusOrderByCreatedAtDesc(
            EmploymentType employmentType, JobStatus status, Pageable pageable);

    /**
     * 제목/부서명 검색
     */
    @Query("SELECT j FROM JobPosting j WHERE " +
           "(LOWER(j.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(j.departmentName) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "AND j.status = :status " +
           "ORDER BY j.createdAt DESC")
    Page<JobPosting> searchByKeyword(@Param("keyword") String keyword,
                                      @Param("status") JobStatus status,
                                      Pageable pageable);

    /**
     * 긴급 채용공고 목록
     */
    List<JobPosting> findByUrgentTrueAndStatus(JobStatus status);

    /**
     * 마감 예정 채용공고 목록
     */
    @Query("SELECT j FROM JobPosting j WHERE j.status = 'PUBLISHED' " +
           "AND j.closeDate IS NOT NULL AND j.closeDate <= :closeDate")
    List<JobPosting> findClosingSoon(@Param("closeDate") LocalDate closeDate);

    /**
     * 마감된 채용공고 목록
     */
    @Query("SELECT j FROM JobPosting j WHERE j.status = 'PUBLISHED' " +
           "AND j.closeDate IS NOT NULL AND j.closeDate < :today")
    List<JobPosting> findExpired(@Param("today") LocalDate today);

    /**
     * 상태별 채용공고 수
     */
    long countByStatus(JobStatus status);

    /**
     * 코드 존재 여부
     */
    boolean existsByJobCode(String jobCode);
}
