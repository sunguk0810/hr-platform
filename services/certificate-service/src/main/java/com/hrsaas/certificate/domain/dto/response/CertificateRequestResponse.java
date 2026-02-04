package com.hrsaas.certificate.domain.dto.response;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.hrsaas.certificate.domain.entity.CertificateRequest;
import com.hrsaas.certificate.domain.entity.RequestStatus;
import com.hrsaas.common.privacy.Masked;
import com.hrsaas.common.privacy.MaskType;
import com.hrsaas.common.privacy.serializer.MaskedFieldSerializer;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

/**
 * 증명서 신청 응답 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CertificateRequestResponse {

    private UUID id;
    private UUID certificateTypeId;
    private String certificateTypeName;
    private UUID employeeId;

    @Masked(type = MaskType.NAME)
    @JsonSerialize(using = MaskedFieldSerializer.class)
    private String employeeName;

    private String employeeNumber;
    private String requestNumber;
    private String purpose;
    private String submissionTarget;
    private Integer copies;
    private String language;
    private boolean includeSalary;
    private LocalDate periodFrom;
    private LocalDate periodTo;
    private Map<String, Object> customFields;
    private String remarks;
    private RequestStatus status;
    private UUID approvalId;
    private UUID approvedBy;
    private Instant approvedAt;
    private String rejectionReason;
    private Instant issuedAt;
    private UUID issuedBy;
    private Instant createdAt;
    private Instant updatedAt;

    public static CertificateRequestResponse from(CertificateRequest entity) {
        return CertificateRequestResponse.builder()
                .id(entity.getId())
                .certificateTypeId(entity.getCertificateType() != null ? entity.getCertificateType().getId() : null)
                .certificateTypeName(entity.getCertificateType() != null ? entity.getCertificateType().getName() : null)
                .employeeId(entity.getEmployeeId())
                .employeeName(entity.getEmployeeName())
                .employeeNumber(entity.getEmployeeNumber())
                .requestNumber(entity.getRequestNumber())
                .purpose(entity.getPurpose())
                .submissionTarget(entity.getSubmissionTarget())
                .copies(entity.getCopies())
                .language(entity.getLanguage())
                .includeSalary(entity.isIncludeSalary())
                .periodFrom(entity.getPeriodFrom())
                .periodTo(entity.getPeriodTo())
                .customFields(entity.getCustomFields())
                .remarks(entity.getRemarks())
                .status(entity.getStatus())
                .approvalId(entity.getApprovalId())
                .approvedBy(entity.getApprovedBy())
                .approvedAt(entity.getApprovedAt())
                .rejectionReason(entity.getRejectionReason())
                .issuedAt(entity.getIssuedAt())
                .issuedBy(entity.getIssuedBy())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
