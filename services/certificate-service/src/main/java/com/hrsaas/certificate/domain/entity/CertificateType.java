package com.hrsaas.certificate.domain.entity;

import com.hrsaas.common.entity.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * 증명서 유형 Entity
 */
@Entity
@Table(name = "certificate_type", schema = "hr_certificate")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CertificateType extends TenantAwareEntity {

    @Column(name = "code", nullable = false, length = 30)
    private String code;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "name_en", length = 100)
    private String nameEn;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "template_id")
    private UUID templateId;

    @Column(name = "requires_approval")
    private boolean requiresApproval = false;

    @Column(name = "approval_template_id")
    private UUID approvalTemplateId;

    @Column(name = "auto_issue")
    private boolean autoIssue = true;

    @Column(name = "valid_days")
    private Integer validDays = 90;

    @Column(name = "fee")
    private BigDecimal fee = BigDecimal.ZERO;

    @Column(name = "max_copies_per_request")
    private Integer maxCopiesPerRequest = 5;

    @Column(name = "sort_order")
    private Integer sortOrder = 0;

    @Column(name = "is_active")
    private boolean active = true;

    @Builder
    public CertificateType(String code, String name, String nameEn, String description,
                           UUID templateId, boolean requiresApproval, boolean autoIssue,
                           Integer validDays, BigDecimal fee, Integer maxCopiesPerRequest,
                           Integer sortOrder) {
        this.code = code;
        this.name = name;
        this.nameEn = nameEn;
        this.description = description;
        this.templateId = templateId;
        this.requiresApproval = requiresApproval;
        this.autoIssue = autoIssue;
        this.validDays = validDays != null ? validDays : 90;
        this.fee = fee != null ? fee : BigDecimal.ZERO;
        this.maxCopiesPerRequest = maxCopiesPerRequest != null ? maxCopiesPerRequest : 5;
        this.sortOrder = sortOrder != null ? sortOrder : 0;
        this.active = true;
    }

    public void activate() {
        this.active = true;
    }

    public void deactivate() {
        this.active = false;
    }
}
