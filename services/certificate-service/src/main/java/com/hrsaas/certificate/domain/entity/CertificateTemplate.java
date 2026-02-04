package com.hrsaas.certificate.domain.entity;

import com.hrsaas.common.entity.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.List;
import java.util.Map;

/**
 * 증명서 템플릿 Entity
 */
@Entity
@Table(name = "certificate_template", schema = "hr_certificate")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CertificateTemplate extends TenantAwareEntity {

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "content_html", nullable = false, columnDefinition = "TEXT")
    private String contentHtml;

    @Column(name = "header_html", columnDefinition = "TEXT")
    private String headerHtml;

    @Column(name = "footer_html", columnDefinition = "TEXT")
    private String footerHtml;

    @Column(name = "css_styles", columnDefinition = "TEXT")
    private String cssStyles;

    @Column(name = "page_size", length = 10)
    private String pageSize = "A4";

    @Column(name = "orientation", length = 10)
    private String orientation = "PORTRAIT";

    @Column(name = "margin_top")
    private Integer marginTop = 20;

    @Column(name = "margin_bottom")
    private Integer marginBottom = 20;

    @Column(name = "margin_left")
    private Integer marginLeft = 20;

    @Column(name = "margin_right")
    private Integer marginRight = 20;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "variables", columnDefinition = "jsonb")
    private List<Map<String, Object>> variables;

    @Column(name = "include_company_seal")
    private boolean includeCompanySeal = true;

    @Column(name = "include_signature")
    private boolean includeSignature = true;

    @Column(name = "seal_image_url", length = 500)
    private String sealImageUrl;

    @Column(name = "signature_image_url", length = 500)
    private String signatureImageUrl;

    @Column(name = "sample_image_url", length = 500)
    private String sampleImageUrl;

    @Column(name = "is_active")
    private boolean active = true;

    @Builder
    public CertificateTemplate(String name, String description, String contentHtml,
                               String headerHtml, String footerHtml, String cssStyles,
                               String pageSize, String orientation,
                               Integer marginTop, Integer marginBottom,
                               Integer marginLeft, Integer marginRight,
                               List<Map<String, Object>> variables,
                               boolean includeCompanySeal, boolean includeSignature) {
        this.name = name;
        this.description = description;
        this.contentHtml = contentHtml;
        this.headerHtml = headerHtml;
        this.footerHtml = footerHtml;
        this.cssStyles = cssStyles;
        this.pageSize = pageSize != null ? pageSize : "A4";
        this.orientation = orientation != null ? orientation : "PORTRAIT";
        this.marginTop = marginTop != null ? marginTop : 20;
        this.marginBottom = marginBottom != null ? marginBottom : 20;
        this.marginLeft = marginLeft != null ? marginLeft : 20;
        this.marginRight = marginRight != null ? marginRight : 20;
        this.variables = variables;
        this.includeCompanySeal = includeCompanySeal;
        this.includeSignature = includeSignature;
        this.active = true;
    }
}
