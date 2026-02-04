package com.hrsaas.certificate.domain.dto.response;

import com.hrsaas.certificate.domain.entity.CertificateType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * 증명서 유형 응답 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CertificateTypeResponse {

    private UUID id;
    private String code;
    private String name;
    private String nameEn;
    private String description;
    private UUID templateId;
    private boolean requiresApproval;
    private UUID approvalTemplateId;
    private boolean autoIssue;
    private Integer validDays;
    private BigDecimal fee;
    private Integer maxCopiesPerRequest;
    private Integer sortOrder;
    private boolean active;
    private Instant createdAt;
    private Instant updatedAt;

    public static CertificateTypeResponse from(CertificateType entity) {
        return CertificateTypeResponse.builder()
                .id(entity.getId())
                .code(entity.getCode())
                .name(entity.getName())
                .nameEn(entity.getNameEn())
                .description(entity.getDescription())
                .templateId(entity.getTemplateId())
                .requiresApproval(entity.isRequiresApproval())
                .approvalTemplateId(entity.getApprovalTemplateId())
                .autoIssue(entity.isAutoIssue())
                .validDays(entity.getValidDays())
                .fee(entity.getFee())
                .maxCopiesPerRequest(entity.getMaxCopiesPerRequest())
                .sortOrder(entity.getSortOrder())
                .active(entity.isActive())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
