package com.hrsaas.recruitment.domain.dto.response;

import com.hrsaas.recruitment.domain.entity.InterviewScore;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

/**
 * 면접 평가 응답 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InterviewScoreResponse {

    private UUID id;
    private UUID interviewId;
    private UUID interviewerId;
    private String interviewerName;
    private String criterion;
    private Integer score;
    private Integer maxScore;
    private Double weight;
    private String comment;
    private double weightedScore;
    private Instant evaluatedAt;

    public static InterviewScoreResponse from(InterviewScore entity) {
        return InterviewScoreResponse.builder()
                .id(entity.getId())
                .interviewId(entity.getInterview() != null ? entity.getInterview().getId() : null)
                .interviewerId(entity.getInterviewerId())
                .interviewerName(entity.getInterviewerName())
                .criterion(entity.getCriterion())
                .score(entity.getScore())
                .maxScore(entity.getMaxScore())
                .weight(entity.getWeight())
                .comment(entity.getComment())
                .weightedScore(entity.getWeightedScore())
                .evaluatedAt(entity.getEvaluatedAt())
                .build();
    }
}
