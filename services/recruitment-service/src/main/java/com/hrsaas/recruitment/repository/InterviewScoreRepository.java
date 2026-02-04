package com.hrsaas.recruitment.repository;

import com.hrsaas.recruitment.domain.entity.InterviewScore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * 면접 평가 Repository
 */
@Repository
public interface InterviewScoreRepository extends JpaRepository<InterviewScore, UUID> {

    /**
     * 면접별 평가 목록
     */
    List<InterviewScore> findByInterviewIdOrderByCriterionAsc(UUID interviewId);

    /**
     * 면접관별 평가 목록
     */
    List<InterviewScore> findByInterviewerIdOrderByEvaluatedAtDesc(UUID interviewerId);

    /**
     * 면접별 면접관별 평가 목록
     */
    List<InterviewScore> findByInterviewIdAndInterviewerIdOrderByCriterionAsc(UUID interviewId, UUID interviewerId);

    /**
     * 면접별 평균 점수
     */
    @Query("SELECT AVG(s.score) FROM InterviewScore s WHERE s.interview.id = :interviewId")
    Double calculateAverageScore(@Param("interviewId") UUID interviewId);

    /**
     * 면접별 가중 평균 점수
     */
    @Query("SELECT SUM(s.score * s.weight) / SUM(s.weight) FROM InterviewScore s WHERE s.interview.id = :interviewId")
    Double calculateWeightedAverageScore(@Param("interviewId") UUID interviewId);

    /**
     * 면접관 평가 존재 여부
     */
    boolean existsByInterviewIdAndInterviewerId(UUID interviewId, UUID interviewerId);

    /**
     * 면접별 평가 수
     */
    long countByInterviewId(UUID interviewId);

    /**
     * 면접관별 평가 수
     */
    long countByInterviewerId(UUID interviewerId);

    /**
     * 면접에 대한 모든 평가 삭제
     */
    void deleteByInterviewId(UUID interviewId);
}
