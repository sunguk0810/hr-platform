package com.hrsaas.recruitment.domain.dto.response;

import com.hrsaas.recruitment.domain.entity.Interview;
import com.hrsaas.recruitment.domain.entity.InterviewStatus;
import com.hrsaas.recruitment.domain.entity.InterviewType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * 면접 응답 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InterviewResponse {

    private UUID id;
    private UUID applicationId;
    private String applicationNumber;
    private String applicantName;
    private String jobTitle;
    private InterviewType interviewType;
    private Integer round;
    private InterviewStatus status;
    private LocalDate scheduledDate;
    private LocalTime scheduledTime;
    private Integer durationMinutes;
    private String location;
    private String meetingUrl;
    private List<Map<String, Object>> interviewers;
    private String notes;
    private String result;
    private String resultNotes;
    private Integer overallScore;
    private Instant startedAt;
    private Instant endedAt;
    private LocalDate feedbackDeadline;
    private int scoreCount;
    private boolean passed;
    private Instant createdAt;
    private Instant updatedAt;

    public static InterviewResponse from(Interview entity) {
        return InterviewResponse.builder()
                .id(entity.getId())
                .applicationId(entity.getApplication() != null ? entity.getApplication().getId() : null)
                .applicationNumber(entity.getApplication() != null ? entity.getApplication().getApplicationNumber() : null)
                .applicantName(entity.getApplication() != null && entity.getApplication().getApplicant() != null
                        ? entity.getApplication().getApplicant().getName() : null)
                .jobTitle(entity.getApplication() != null && entity.getApplication().getJobPosting() != null
                        ? entity.getApplication().getJobPosting().getTitle() : null)
                .interviewType(entity.getInterviewType())
                .round(entity.getRound())
                .status(entity.getStatus())
                .scheduledDate(entity.getScheduledDate())
                .scheduledTime(entity.getScheduledTime())
                .durationMinutes(entity.getDurationMinutes())
                .location(entity.getLocation())
                .meetingUrl(entity.getMeetingUrl())
                .interviewers(entity.getInterviewers())
                .notes(entity.getNotes())
                .result(entity.getResult())
                .resultNotes(entity.getResultNotes())
                .overallScore(entity.getOverallScore())
                .startedAt(entity.getStartedAt())
                .endedAt(entity.getEndedAt())
                .feedbackDeadline(entity.getFeedbackDeadline())
                .scoreCount(entity.getScores() != null ? entity.getScores().size() : 0)
                .passed(entity.isPassed())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
