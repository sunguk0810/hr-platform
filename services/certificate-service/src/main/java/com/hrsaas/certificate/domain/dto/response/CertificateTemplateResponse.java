package com.hrsaas.certificate.domain.dto.response;

import com.hrsaas.certificate.domain.entity.CertificateTemplate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * 증명서 템플릿 응답 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CertificateTemplateResponse {

    private UUID id;
    private String name;
    private String description;
    private String contentHtml;
    private String headerHtml;
    private String footerHtml;
    private String cssStyles;
    private String pageSize;
    private String orientation;
    private Integer marginTop;
    private Integer marginBottom;
    private Integer marginLeft;
    private Integer marginRight;
    private List<Map<String, Object>> variables;
    private boolean includeCompanySeal;
    private boolean includeSignature;
    private String sealImageUrl;
    private String signatureImageUrl;
    private String sampleImageUrl;
    private boolean active;
    private Instant createdAt;
    private Instant updatedAt;

    public static CertificateTemplateResponse from(CertificateTemplate entity) {
        return CertificateTemplateResponse.builder()
                .id(entity.getId())
                .name(entity.getName())
                .description(entity.getDescription())
                .contentHtml(entity.getContentHtml())
                .headerHtml(entity.getHeaderHtml())
                .footerHtml(entity.getFooterHtml())
                .cssStyles(entity.getCssStyles())
                .pageSize(entity.getPageSize())
                .orientation(entity.getOrientation())
                .marginTop(entity.getMarginTop())
                .marginBottom(entity.getMarginBottom())
                .marginLeft(entity.getMarginLeft())
                .marginRight(entity.getMarginRight())
                .variables(entity.getVariables())
                .includeCompanySeal(entity.isIncludeCompanySeal())
                .includeSignature(entity.isIncludeSignature())
                .sealImageUrl(entity.getSealImageUrl())
                .signatureImageUrl(entity.getSignatureImageUrl())
                .sampleImageUrl(entity.getSampleImageUrl())
                .active(entity.isActive())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
