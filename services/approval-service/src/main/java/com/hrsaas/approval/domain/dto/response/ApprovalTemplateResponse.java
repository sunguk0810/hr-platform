package com.hrsaas.approval.domain.dto.response;

import com.hrsaas.approval.domain.entity.ApprovalTemplate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApprovalTemplateResponse {

    private UUID id;
    private String code;
    private String name;
    private String documentType;
    private String description;
    private Boolean isActive;
    private Integer sortOrder;
    private List<ApprovalTemplateLineResponse> templateLines;
    private Instant createdAt;
    private Instant updatedAt;

    public static ApprovalTemplateResponse from(ApprovalTemplate template) {
        return ApprovalTemplateResponse.builder()
            .id(template.getId())
            .code(template.getCode())
            .name(template.getName())
            .documentType(template.getDocumentType())
            .description(template.getDescription())
            .isActive(template.getIsActive())
            .sortOrder(template.getSortOrder())
            .templateLines(template.getTemplateLines().stream()
                .map(ApprovalTemplateLineResponse::from)
                .toList())
            .createdAt(template.getCreatedAt())
            .updatedAt(template.getUpdatedAt())
            .build();
    }
}
