package com.hrsaas.mdm.domain.dto.response;

import com.hrsaas.mdm.domain.entity.CodeTenantMapping;
import com.hrsaas.mdm.domain.entity.CommonCode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantCodeResponse {

    private UUID id;
    private UUID tenantId;
    private UUID codeId;
    private String groupCode;
    private String code;

    // Original values
    private String originalCodeName;
    private String originalCodeNameEn;
    private String originalDescription;
    private Integer originalSortOrder;

    // Custom values
    private String customCodeName;
    private String customCodeNameEn;
    private String customDescription;
    private String customExtraValue1;
    private String customExtraValue2;
    private String customExtraValue3;
    private String customExtraJson;
    private Integer customSortOrder;

    // Effective values (custom if set, otherwise original)
    private String effectiveCodeName;
    private String effectiveCodeNameEn;
    private String effectiveDescription;
    private Integer effectiveSortOrder;

    private boolean hidden;
    private boolean active;
    private boolean customized;

    private Instant createdAt;
    private Instant updatedAt;

    public static TenantCodeResponse from(CodeTenantMapping mapping) {
        CommonCode code = mapping.getCommonCode();
        return TenantCodeResponse.builder()
            .id(mapping.getId())
            .tenantId(mapping.getTenantId())
            .codeId(code.getId())
            .groupCode(code.getCodeGroup().getGroupCode())
            .code(code.getCode())
            .originalCodeName(code.getCodeName())
            .originalCodeNameEn(code.getCodeNameEn())
            .originalDescription(code.getDescription())
            .originalSortOrder(code.getSortOrder())
            .customCodeName(mapping.getCustomCodeName())
            .customCodeNameEn(mapping.getCustomCodeNameEn())
            .customDescription(mapping.getCustomDescription())
            .customExtraValue1(mapping.getCustomExtraValue1())
            .customExtraValue2(mapping.getCustomExtraValue2())
            .customExtraValue3(mapping.getCustomExtraValue3())
            .customExtraJson(mapping.getCustomExtraJson())
            .customSortOrder(mapping.getCustomSortOrder())
            .effectiveCodeName(mapping.getEffectiveCodeName())
            .effectiveCodeNameEn(mapping.getEffectiveCodeNameEn())
            .effectiveDescription(mapping.getEffectiveDescription())
            .effectiveSortOrder(mapping.getEffectiveSortOrder())
            .hidden(mapping.isHidden())
            .active(mapping.isActive())
            .customized(hasCustomization(mapping))
            .createdAt(mapping.getCreatedAt())
            .updatedAt(mapping.getUpdatedAt())
            .build();
    }

    private static boolean hasCustomization(CodeTenantMapping mapping) {
        return mapping.getCustomCodeName() != null ||
               mapping.getCustomCodeNameEn() != null ||
               mapping.getCustomDescription() != null ||
               mapping.getCustomExtraValue1() != null ||
               mapping.getCustomExtraValue2() != null ||
               mapping.getCustomExtraValue3() != null ||
               mapping.getCustomExtraJson() != null ||
               mapping.getCustomSortOrder() != null ||
               mapping.isHidden();
    }
}
