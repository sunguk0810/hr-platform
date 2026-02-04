package com.hrsaas.mdm.domain.entity;

import com.hrsaas.common.entity.AuditableEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

/**
 * 테넌트별 코드 커스터마이징 엔티티
 * 시스템 공통 코드를 테넌트별로 재정의하거나 확장할 수 있습니다.
 */
@Entity
@Table(name = "code_tenant_mapping", schema = "tenant_common",
    uniqueConstraints = @UniqueConstraint(columnNames = {"tenant_id", "common_code_id"}))
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CodeTenantMapping extends AuditableEntity {

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "common_code_id", nullable = false)
    private CommonCode commonCode;

    @Column(name = "custom_code_name", length = 100)
    private String customCodeName;

    @Column(name = "custom_code_name_en", length = 100)
    private String customCodeNameEn;

    @Column(name = "custom_description", length = 500)
    private String customDescription;

    @Column(name = "custom_extra_value1", length = 100)
    private String customExtraValue1;

    @Column(name = "custom_extra_value2", length = 100)
    private String customExtraValue2;

    @Column(name = "custom_extra_value3", length = 100)
    private String customExtraValue3;

    @Column(name = "custom_extra_json", columnDefinition = "TEXT")
    private String customExtraJson;

    @Column(name = "custom_sort_order")
    private Integer customSortOrder;

    @Column(name = "is_hidden", nullable = false)
    private boolean hidden = false;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Builder
    public CodeTenantMapping(UUID tenantId, CommonCode commonCode,
                              String customCodeName, String customCodeNameEn,
                              String customDescription,
                              String customExtraValue1, String customExtraValue2,
                              String customExtraValue3, String customExtraJson,
                              Integer customSortOrder, boolean hidden) {
        this.tenantId = tenantId;
        this.commonCode = commonCode;
        this.customCodeName = customCodeName;
        this.customCodeNameEn = customCodeNameEn;
        this.customDescription = customDescription;
        this.customExtraValue1 = customExtraValue1;
        this.customExtraValue2 = customExtraValue2;
        this.customExtraValue3 = customExtraValue3;
        this.customExtraJson = customExtraJson;
        this.customSortOrder = customSortOrder;
        this.hidden = hidden;
        this.active = true;
    }

    public void update(String customCodeName, String customCodeNameEn,
                       String customDescription,
                       String customExtraValue1, String customExtraValue2,
                       String customExtraValue3, String customExtraJson,
                       Integer customSortOrder, Boolean hidden) {
        if (customCodeName != null) {
            this.customCodeName = customCodeName;
        }
        if (customCodeNameEn != null) {
            this.customCodeNameEn = customCodeNameEn;
        }
        if (customDescription != null) {
            this.customDescription = customDescription;
        }
        if (customExtraValue1 != null) {
            this.customExtraValue1 = customExtraValue1;
        }
        if (customExtraValue2 != null) {
            this.customExtraValue2 = customExtraValue2;
        }
        if (customExtraValue3 != null) {
            this.customExtraValue3 = customExtraValue3;
        }
        if (customExtraJson != null) {
            this.customExtraJson = customExtraJson;
        }
        if (customSortOrder != null) {
            this.customSortOrder = customSortOrder;
        }
        if (hidden != null) {
            this.hidden = hidden;
        }
    }

    public void hide() {
        this.hidden = true;
    }

    public void show() {
        this.hidden = false;
    }

    public void activate() {
        this.active = true;
    }

    public void deactivate() {
        this.active = false;
    }

    /**
     * 테넌트별 커스텀 값이 있으면 커스텀 값을, 없으면 원본 코드 값을 반환
     */
    public String getEffectiveCodeName() {
        return customCodeName != null ? customCodeName : commonCode.getCodeName();
    }

    public String getEffectiveCodeNameEn() {
        return customCodeNameEn != null ? customCodeNameEn : commonCode.getCodeNameEn();
    }

    public String getEffectiveDescription() {
        return customDescription != null ? customDescription : commonCode.getDescription();
    }

    public Integer getEffectiveSortOrder() {
        return customSortOrder != null ? customSortOrder : commonCode.getSortOrder();
    }
}
