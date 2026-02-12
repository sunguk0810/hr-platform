package com.hrsaas.recruitment.repository;

import com.hrsaas.recruitment.domain.entity.Interview;
import com.hrsaas.recruitment.domain.entity.InterviewStatus;
import com.hrsaas.recruitment.domain.entity.InterviewType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * 면접 Repository
 */
@Repository
public interface InterviewRepository extends JpaRepository<Interview, UUID> {

    /**
     * 지원서별 면접 목록
     */
    List<Interview> findByApplicationIdOrderByRoundAsc(UUID applicationId);

    /**
     * 상태별 면접 목록
     */
    Page<Interview> findByStatusOrderByScheduledDateAscScheduledTimeAsc(InterviewStatus status, Pageable pageable);

    /**
     * 날짜별 면접 목록
     */
    List<Interview> findByScheduledDateOrderByScheduledTimeAsc(LocalDate scheduledDate);

    /**
     * 면접관별 면접 목록
     */
    @Query(value = "SELECT * FROM hr_recruitment.interview i WHERE " +
           "jsonb_path_exists(i.interviewers, CAST('$[*] ? (@.id == \"' || :interviewerId || '\")' AS jsonpath)) " +
           "ORDER BY i.scheduled_date ASC, i.scheduled_time ASC",
           countQuery = "SELECT COUNT(*) FROM hr_recruitment.interview i WHERE " +
           "jsonb_path_exists(i.interviewers, CAST('$[*] ? (@.id == \"' || :interviewerId || '\")' AS jsonpath))",
           nativeQuery = true)
    Page<Interview> findByInterviewerId(@Param("interviewerId") String interviewerId, Pageable pageable);

    /**
     * 기간별 예정 면접 목록
     */
    @Query(value = "SELECT * FROM hr_recruitment.interview WHERE " +
           "scheduled_date BETWEEN :startDate AND :endDate " +
           "AND status IN ('SCHEDULED', 'IN_PROGRESS') " +
           "ORDER BY scheduled_date ASC, scheduled_time ASC",
           nativeQuery = true)
    List<Interview> findScheduledInterviews(@Param("startDate") LocalDate startDate,
                                             @Param("endDate") LocalDate endDate);

    /**
     * 피드백 기한 초과 면접 목록
     */
    @Query(value = "SELECT * FROM hr_recruitment.interview WHERE " +
           "status = 'COMPLETED' AND result IS NULL " +
           "AND feedback_deadline < :today",
           nativeQuery = true)
    List<Interview> findOverdueFeedback(@Param("today") LocalDate today);

    /**
     * 피드백 기한 당일 면접 목록
     */
    @Query(value = "SELECT * FROM hr_recruitment.interview WHERE " +
           "status = 'COMPLETED' AND result IS NULL " +
           "AND feedback_deadline = :today",
           nativeQuery = true)
    List<Interview> findFeedbackDeadlineToday(@Param("today") LocalDate today);

    /**
     * 면접 유형별 목록
     */
    Page<Interview> findByInterviewTypeOrderByScheduledDateDesc(InterviewType interviewType, Pageable pageable);

    /**
     * 라운드별 면접 목록
     */
    Page<Interview> findByRoundOrderByScheduledDateDesc(Integer round, Pageable pageable);

    /**
     * 상태별 면접 수
     */
    long countByStatus(InterviewStatus status);

    /**
     * 날짜별 면접 수
     */
    long countByScheduledDate(LocalDate scheduledDate);

    /**
     * 지원서별 완료된 면접 수
     */
    long countByApplicationIdAndStatus(UUID applicationId, InterviewStatus status);

    /**
     * 오늘 예정된 면접 목록
     */
    @Query(value = "SELECT * FROM hr_recruitment.interview WHERE " +
           "scheduled_date = :today AND status = 'SCHEDULED' " +
           "ORDER BY scheduled_time ASC",
           nativeQuery = true)
    List<Interview> findTodayScheduledInterviews(@Param("today") LocalDate today);

    /**
     * 상태별 면접 수 GROUP BY 집계 (getSummary N+1 해결용).
     * 8개 개별 COUNT 쿼리를 1개 GROUP BY 쿼리로 통합.
     */
    @Query("SELECT i.status, COUNT(i) FROM Interview i GROUP BY i.status")
    List<Object[]> countGroupByStatus();
}
