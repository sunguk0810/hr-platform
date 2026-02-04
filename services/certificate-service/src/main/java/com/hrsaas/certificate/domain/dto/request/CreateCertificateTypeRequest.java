package com.hrsaas.certificate.domain.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * 증명서 유형 생성 요청 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateCertificateTypeRequest {

    @NotBlank(message = "증명서 유형 코드는 필수입니다")
    @Size(max = 30, message = "증명서 유형 코드는 30자 이내여야 합니다")
    private String code;

    @NotBlank(message = "증명서 유형명은 필수입니다")
    @Size(max = 100, message = "증명서 유형명은 100자 이내여야 합니다")
    private String name;

    @Size(max = 100, message = "영문명은 100자 이내여야 합니다")
    private String nameEn;

    private String description;

    private UUID templateId;

    private boolean requiresApproval;

    private UUID approvalTemplateId;

    private boolean autoIssue = true;

    private Integer validDays = 90;

    private BigDecimal fee;

    private Integer maxCopiesPerRequest = 5;

    private Integer sortOrder = 0;
}
