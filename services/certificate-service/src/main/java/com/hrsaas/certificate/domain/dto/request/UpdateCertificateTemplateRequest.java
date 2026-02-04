package com.hrsaas.certificate.domain.dto.request;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * 증명서 템플릿 수정 요청 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateCertificateTemplateRequest {

    @Size(max = 100, message = "템플릿명은 100자 이내여야 합니다")
    private String name;

    private String description;

    private String contentHtml;

    private String headerHtml;

    private String footerHtml;

    private String cssStyles;

    @Size(max = 10, message = "페이지 크기는 10자 이내여야 합니다")
    private String pageSize;

    @Size(max = 10, message = "방향은 10자 이내여야 합니다")
    private String orientation;

    private Integer marginTop;
    private Integer marginBottom;
    private Integer marginLeft;
    private Integer marginRight;

    private List<Map<String, Object>> variables;

    private Boolean includeCompanySeal;
    private Boolean includeSignature;

    private String sealImageUrl;
    private String signatureImageUrl;
    private String sampleImageUrl;

    private Boolean active;
}
