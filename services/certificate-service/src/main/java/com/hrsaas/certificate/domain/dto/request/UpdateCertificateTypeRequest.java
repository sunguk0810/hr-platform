package com.hrsaas.certificate.domain.dto.request;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * 증명서 유형 수정 요청 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateCertificateTypeRequest {

    @Size(max = 100, message = "증명서 유형명은 100자 이내여야 합니다")
    private String name;

    @Size(max = 100, message = "영문명은 100자 이내여야 합니다")
    private String nameEn;

    private String description;

    private UUID templateId;

    private Boolean requiresApproval;

    private UUID approvalTemplateId;

    private Boolean autoIssue;

    private Integer validDays;

    private BigDecimal fee;

    private Integer maxCopiesPerRequest;

    private Integer sortOrder;

    private Boolean active;
}
