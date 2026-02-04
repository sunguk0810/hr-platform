package com.hrsaas.certificate.domain.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * 증명서 템플릿 생성 요청 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateCertificateTemplateRequest {

    @NotBlank(message = "템플릿명은 필수입니다")
    @Size(max = 100, message = "템플릿명은 100자 이내여야 합니다")
    private String name;

    private String description;

    @NotBlank(message = "템플릿 내용은 필수입니다")
    private String contentHtml;

    private String headerHtml;

    private String footerHtml;

    private String cssStyles;

    @Size(max = 10, message = "페이지 크기는 10자 이내여야 합니다")
    private String pageSize = "A4";

    @Size(max = 10, message = "방향은 10자 이내여야 합니다")
    private String orientation = "PORTRAIT";

    private Integer marginTop = 20;
    private Integer marginBottom = 20;
    private Integer marginLeft = 20;
    private Integer marginRight = 20;

    private List<Map<String, Object>> variables;

    private boolean includeCompanySeal = true;
    private boolean includeSignature = true;
}
