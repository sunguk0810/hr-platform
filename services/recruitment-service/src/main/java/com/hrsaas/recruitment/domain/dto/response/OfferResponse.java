package com.hrsaas.recruitment.domain.dto.response;

import com.hrsaas.recruitment.domain.entity.EmploymentType;
import com.hrsaas.recruitment.domain.entity.Offer;
import com.hrsaas.recruitment.domain.entity.OfferStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

/**
 * 채용 제안 응답 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OfferResponse {

    private UUID id;
    private UUID applicationId;
    private String applicationNumber;
    private String applicantName;
    private String jobTitle;
    private String offerNumber;
    private OfferStatus status;
    private String positionTitle;
    private UUID departmentId;
    private String departmentName;
    private String gradeCode;
    private String gradeName;
    private BigDecimal baseSalary;
    private BigDecimal signingBonus;
    private Map<String, Object> benefits;
    private LocalDate startDate;
    private EmploymentType employmentType;
    private Integer probationMonths;
    private String workLocation;
    private UUID reportToId;
    private String reportToName;
    private UUID offerLetterFileId;
    private String specialTerms;
    private Instant expiresAt;
    private Instant sentAt;
    private Instant respondedAt;
    private String declineReason;
    private UUID approvedBy;
    private Instant approvedAt;
    private String negotiationNotes;
    private boolean expired;
    private Instant createdAt;
    private Instant updatedAt;

    public static OfferResponse from(Offer entity) {
        return OfferResponse.builder()
                .id(entity.getId())
                .applicationId(entity.getApplication() != null ? entity.getApplication().getId() : null)
                .applicationNumber(entity.getApplication() != null ? entity.getApplication().getApplicationNumber() : null)
                .applicantName(entity.getApplication() != null && entity.getApplication().getApplicant() != null
                        ? entity.getApplication().getApplicant().getName() : null)
                .jobTitle(entity.getApplication() != null && entity.getApplication().getJobPosting() != null
                        ? entity.getApplication().getJobPosting().getTitle() : null)
                .offerNumber(entity.getOfferNumber())
                .status(entity.getStatus())
                .positionTitle(entity.getPositionTitle())
                .departmentId(entity.getDepartmentId())
                .departmentName(entity.getDepartmentName())
                .gradeCode(entity.getGradeCode())
                .gradeName(entity.getGradeName())
                .baseSalary(entity.getBaseSalary())
                .signingBonus(entity.getSigningBonus())
                .benefits(entity.getBenefits())
                .startDate(entity.getStartDate())
                .employmentType(entity.getEmploymentType())
                .probationMonths(entity.getProbationMonths())
                .workLocation(entity.getWorkLocation())
                .reportToId(entity.getReportToId())
                .reportToName(entity.getReportToName())
                .offerLetterFileId(entity.getOfferLetterFileId())
                .specialTerms(entity.getSpecialTerms())
                .expiresAt(entity.getExpiresAt())
                .sentAt(entity.getSentAt())
                .respondedAt(entity.getRespondedAt())
                .declineReason(entity.getDeclineReason())
                .approvedBy(entity.getApprovedBy())
                .approvedAt(entity.getApprovedAt())
                .negotiationNotes(entity.getNegotiationNotes())
                .expired(entity.isExpired())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
