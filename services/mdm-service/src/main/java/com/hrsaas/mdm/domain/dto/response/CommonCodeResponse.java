package com.hrsaas.mdm.domain.dto.response;

import com.hrsaas.mdm.domain.entity.CodeStatus;
import com.hrsaas.mdm.domain.entity.CommonCode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommonCodeResponse {

    private UUID id;
    private String groupCode;
    private UUID parentCodeId;
    private Integer level;
    private String code;
    private String codeName;
    private String codeNameEn;
    private String description;
    private String extraValue1;
    private String extraValue2;
    private String extraValue3;
    private String extraJson;
    private boolean defaultCode;
    private LocalDate effectiveFrom;
    private LocalDate effectiveTo;
    private CodeStatus status;
    private boolean active;
    private boolean effective;
    private Integer sortOrder;
    private List<CommonCodeResponse> children;
    private Instant createdAt;
    private Instant updatedAt;

    // G04: 폐기 관련 필드
    private UUID replacementCodeId;
    private Instant deprecatedAt;
    private Integer deprecationGracePeriodDays;
    private Boolean gracePeriodActive;

    public static CommonCodeResponse from(CommonCode commonCode) {
        return CommonCodeResponse.builder()
            .id(commonCode.getId())
            .groupCode(commonCode.getCodeGroup().getGroupCode())
            .parentCodeId(commonCode.getParentCodeId())
            .level(commonCode.getLevel())
            .code(commonCode.getCode())
            .codeName(commonCode.getCodeName())
            .codeNameEn(commonCode.getCodeNameEn())
            .description(commonCode.getDescription())
            .extraValue1(commonCode.getExtraValue1())
            .extraValue2(commonCode.getExtraValue2())
            .extraValue3(commonCode.getExtraValue3())
            .extraJson(commonCode.getExtraJson())
            .defaultCode(commonCode.isDefaultCode())
            .effectiveFrom(commonCode.getEffectiveFrom())
            .effectiveTo(commonCode.getEffectiveTo())
            .status(commonCode.getStatus())
            .active(commonCode.isActive())
            .effective(commonCode.isEffective())
            .sortOrder(commonCode.getSortOrder())
            .createdAt(commonCode.getCreatedAt())
            .updatedAt(commonCode.getUpdatedAt())
            .replacementCodeId(commonCode.getReplacementCodeId())
            .deprecatedAt(commonCode.getDeprecatedAt())
            .deprecationGracePeriodDays(commonCode.getDeprecationGracePeriodDays())
            .gracePeriodActive(commonCode.isGracePeriodActive())
            .build();
    }

    public static CommonCodeResponse fromWithChildren(CommonCode commonCode) {
        CommonCodeResponse response = from(commonCode);
        if (commonCode.getChildCodes() != null && !commonCode.getChildCodes().isEmpty()) {
            response.setChildren(commonCode.getChildCodes().stream()
                .map(CommonCodeResponse::fromWithChildren)
                .toList());
        } else {
            response.setChildren(new ArrayList<>());
        }
        return response;
    }
}
