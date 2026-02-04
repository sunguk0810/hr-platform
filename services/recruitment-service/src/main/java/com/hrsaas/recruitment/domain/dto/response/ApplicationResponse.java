package com.hrsaas.recruitment.domain.dto.response;

import com.hrsaas.recruitment.domain.entity.Application;
import com.hrsaas.recruitment.domain.entity.ApplicationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * 지원서 응답 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApplicationResponse {

    private UUID id;
    private UUID jobPostingId;
    private String jobTitle;
    private UUID applicantId;
    private String applicantName;
    private String applicantEmail;
    private String applicationNumber;
    private ApplicationStatus status;
    private String coverLetter;
    private List<Map<String, Object>> answers;
    private Long expectedSalary;
    private String availableDate;
    private String referrerName;
    private UUID referrerEmployeeId;
    private Integer screeningScore;
    private String screeningNotes;
    private UUID screenedBy;
    private Instant screenedAt;
    private String currentStage;
    private Integer stageOrder;
    private String rejectionReason;
    private Instant rejectedAt;
    private Instant withdrawnAt;
    private Instant hiredAt;
    private int interviewCount;
    private Instant createdAt;
    private Instant updatedAt;

    public static ApplicationResponse from(Application entity) {
        return ApplicationResponse.builder()
                .id(entity.getId())
                .jobPostingId(entity.getJobPosting() != null ? entity.getJobPosting().getId() : null)
                .jobTitle(entity.getJobPosting() != null ? entity.getJobPosting().getTitle() : null)
                .applicantId(entity.getApplicant() != null ? entity.getApplicant().getId() : null)
                .applicantName(entity.getApplicant() != null ? entity.getApplicant().getName() : null)
                .applicantEmail(entity.getApplicant() != null ? entity.getApplicant().getEmail() : null)
                .applicationNumber(entity.getApplicationNumber())
                .status(entity.getStatus())
                .coverLetter(entity.getCoverLetter())
                .answers(entity.getAnswers())
                .expectedSalary(entity.getExpectedSalary())
                .availableDate(entity.getAvailableDate())
                .referrerName(entity.getReferrerName())
                .referrerEmployeeId(entity.getReferrerEmployeeId())
                .screeningScore(entity.getScreeningScore())
                .screeningNotes(entity.getScreeningNotes())
                .screenedBy(entity.getScreenedBy())
                .screenedAt(entity.getScreenedAt())
                .currentStage(entity.getCurrentStage())
                .stageOrder(entity.getStageOrder())
                .rejectionReason(entity.getRejectionReason())
                .rejectedAt(entity.getRejectedAt())
                .withdrawnAt(entity.getWithdrawnAt())
                .hiredAt(entity.getHiredAt())
                .interviewCount(entity.getInterviews() != null ? entity.getInterviews().size() : 0)
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
