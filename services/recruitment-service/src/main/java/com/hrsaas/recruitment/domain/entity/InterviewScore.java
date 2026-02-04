package com.hrsaas.recruitment.domain.entity;

import com.hrsaas.common.entity.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * 면접 평가 Entity
 */
@Entity
@Table(name = "interview_score", schema = "hr_recruitment")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class InterviewScore extends TenantAwareEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "interview_id", nullable = false)
    private Interview interview;

    @Column(name = "interviewer_id", nullable = false)
    private UUID interviewerId;

    @Column(name = "interviewer_name", length = 100)
    private String interviewerName;

    @Column(name = "criterion", nullable = false, length = 100)
    private String criterion;

    @Column(name = "score", nullable = false)
    private Integer score;

    @Column(name = "max_score")
    private Integer maxScore = 5;

    @Column(name = "weight")
    private Double weight = 1.0;

    @Column(name = "comment", columnDefinition = "TEXT")
    private String comment;

    @Column(name = "evaluated_at")
    private Instant evaluatedAt;

    @Builder
    public InterviewScore(Interview interview, UUID interviewerId, String interviewerName,
                          String criterion, Integer score, Integer maxScore, Double weight,
                          String comment) {
        this.interview = interview;
        this.interviewerId = interviewerId;
        this.interviewerName = interviewerName;
        this.criterion = criterion;
        this.score = score;
        this.maxScore = maxScore != null ? maxScore : 5;
        this.weight = weight != null ? weight : 1.0;
        this.comment = comment;
        this.evaluatedAt = Instant.now();
    }

    public double getWeightedScore() {
        return (score.doubleValue() / maxScore.doubleValue()) * weight * 100;
    }
}
