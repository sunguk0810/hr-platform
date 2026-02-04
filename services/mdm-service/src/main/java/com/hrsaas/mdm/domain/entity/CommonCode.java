package com.hrsaas.mdm.domain.entity;

import com.hrsaas.common.entity.AuditableEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
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

    @Column(name = "parent_code_id")
    private UUID parentCodeId; // for hierarchical codes

    @Column(name = "level", nullable = false)
    private Integer level = 1;

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

    @Column(name = "extra_json", columnDefinition = "TEXT")
    private String extraJson;

    @Column(name = "is_default", nullable = false)
    private boolean defaultCode = false;

    @Column(name = "effective_from")
    private LocalDate effectiveFrom;

    @Column(name = "effective_to")
    private LocalDate effectiveTo;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private CodeStatus status = CodeStatus.ACTIVE;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Column(name = "sort_order")
    private Integer sortOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_code_id", insertable = false, updatable = false)
    private CommonCode parentCode;

    @OneToMany(mappedBy = "parentCode")
    @OrderBy("sortOrder ASC")
    private List<CommonCode> childCodes = new ArrayList<>();

    @Builder
    public CommonCode(CodeGroup codeGroup, UUID tenantId, UUID parentCodeId, Integer level,
                      String code, String codeName, String codeNameEn, String description,
                      String extraValue1, String extraValue2, String extraValue3,
                      String extraJson, boolean defaultCode,
                      LocalDate effectiveFrom, LocalDate effectiveTo, Integer sortOrder) {
        this.codeGroup = codeGroup;
        this.tenantId = tenantId;
        this.parentCodeId = parentCodeId;
        this.level = level != null ? level : 1;
        this.code = code;
        this.codeName = codeName;
        this.codeNameEn = codeNameEn;
        this.description = description;
        this.extraValue1 = extraValue1;
        this.extraValue2 = extraValue2;
        this.extraValue3 = extraValue3;
        this.extraJson = extraJson;
        this.defaultCode = defaultCode;
        this.effectiveFrom = effectiveFrom;
        this.effectiveTo = effectiveTo;
        this.sortOrder = sortOrder;
        this.status = CodeStatus.ACTIVE;
        this.active = true;
    }

    public void activate() {
        this.status = CodeStatus.ACTIVE;
        this.active = true;
    }

    public void deactivate() {
        this.status = CodeStatus.INACTIVE;
        this.active = false;
    }

    public void deprecate() {
        this.status = CodeStatus.DEPRECATED;
        this.active = false;
    }

    public boolean isEffective() {
        LocalDate today = LocalDate.now();
        boolean afterStart = effectiveFrom == null || !today.isBefore(effectiveFrom);
        boolean beforeEnd = effectiveTo == null || !today.isAfter(effectiveTo);
        return afterStart && beforeEnd && active;
    }

    public void update(String codeName, String codeNameEn, String description,
                       String extraValue1, String extraValue2, String extraValue3,
                       String extraJson, Boolean defaultCode,
                       LocalDate effectiveFrom, LocalDate effectiveTo, Integer sortOrder) {
        if (codeName != null) {
            this.codeName = codeName;
        }
        if (codeNameEn != null) {
            this.codeNameEn = codeNameEn;
        }
        if (description != null) {
            this.description = description;
        }
        if (extraValue1 != null) {
            this.extraValue1 = extraValue1;
        }
        if (extraValue2 != null) {
            this.extraValue2 = extraValue2;
        }
        if (extraValue3 != null) {
            this.extraValue3 = extraValue3;
        }
        if (extraJson != null) {
            this.extraJson = extraJson;
        }
        if (defaultCode != null) {
            this.defaultCode = defaultCode;
        }
        if (effectiveFrom != null) {
            this.effectiveFrom = effectiveFrom;
        }
        if (effectiveTo != null) {
            this.effectiveTo = effectiveTo;
        }
        if (sortOrder != null) {
            this.sortOrder = sortOrder;
        }
    }

    public void setParent(CommonCode parent) {
        this.parentCode = parent;
        this.parentCodeId = parent != null ? parent.getId() : null;
        this.level = parent != null ? parent.getLevel() + 1 : 1;
    }
}
