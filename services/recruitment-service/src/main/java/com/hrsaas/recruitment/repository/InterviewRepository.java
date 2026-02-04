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
    @Query("SELECT i FROM Interview i WHERE " +
           "jsonb_path_exists(i.interviewers, '$[*] \\? (@.id == :interviewerId)') = true " +
           "ORDER BY i.scheduledDate ASC, i.scheduledTime ASC")
    Page<Interview> findByInterviewerId(@Param("interviewerId") String interviewerId, Pageable pageable);

    /**
     * 기간별 예정 면접 목록
     */
    @Query("SELECT i FROM Interview i WHERE " +
           "i.scheduledDate BETWEEN :startDate AND :endDate " +
           "AND i.status IN ('SCHEDULED', 'IN_PROGRESS') " +
           "ORDER BY i.scheduledDate ASC, i.scheduledTime ASC")
    List<Interview> findScheduledInterviews(@Param("startDate") LocalDate startDate,
                                             @Param("endDate") LocalDate endDate);

    /**
     * 피드백 기한 초과 면접 목록
     */
    @Query("SELECT i FROM Interview i WHERE " +
           "i.status = 'COMPLETED' AND i.result IS NULL " +
           "AND i.feedbackDeadline < :today")
    List<Interview> findOverdueFeedback(@Param("today") LocalDate today);

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
    @Query("SELECT i FROM Interview i WHERE " +
           "i.scheduledDate = :today AND i.status = 'SCHEDULED' " +
           "ORDER BY i.scheduledTime ASC")
    List<Interview> findTodayScheduledInterviews(@Param("today") LocalDate today);
}
