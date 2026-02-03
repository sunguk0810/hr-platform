package com.hrsaas.mdm.domain.entity;

import com.hrsaas.common.entity.AuditableEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "common_code", schema = "tenant_common")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CommonCode extends AuditableEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "code_group_id", nullable = false)
    private CodeGroup codeGroup;

    @Column(name = "tenant_id")
    private UUID tenantId; // null for system codes

    @Column(name = "code", nullable = false, length = 50)
    private String code;

    @Column(name = "code_name", nullable = false, length = 100)
    private String codeName;

    @Column(name = "code_name_en", length = 100)
    private String codeNameEn;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "extra_value1", length = 100)
    private String extraValue1;

    @Column(name = "extra_value2", length = 100)
    private String extraValue2;

    @Column(name = "extra_value3", length = 100)
    private String extraValue3;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Column(name = "sort_order")
    private Integer sortOrder;

    @Builder
    public CommonCode(CodeGroup codeGroup, UUID tenantId, String code, String codeName,
                      String codeNameEn, String description, String extraValue1,
                      String extraValue2, String extraValue3, Integer sortOrder) {
        this.codeGroup = codeGroup;
        this.tenantId = tenantId;
        this.code = code;
        this.codeName = codeName;
        this.codeNameEn = codeNameEn;
        this.description = description;
        this.extraValue1 = extraValue1;
        this.extraValue2 = extraValue2;
        this.extraValue3 = extraValue3;
        this.sortOrder = sortOrder;
        this.active = true;
    }

    public void activate() {
        this.active = true;
    }

    public void deactivate() {
        this.active = false;
    }
}
