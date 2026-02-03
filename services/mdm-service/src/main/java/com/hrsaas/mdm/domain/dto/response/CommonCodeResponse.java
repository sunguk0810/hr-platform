package com.hrsaas.mdm.domain.dto.response;

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
public class CommonCodeResponse {

    private UUID id;
    private String groupCode;
    private String code;
    private String codeName;
    private String codeNameEn;
    private String description;
    private String extraValue1;
    private String extraValue2;
    private String extraValue3;
    private boolean active;
    private Integer sortOrder;
    private Instant createdAt;
    private Instant updatedAt;

    public static CommonCodeResponse from(CommonCode commonCode) {
        return CommonCodeResponse.builder()
            .id(commonCode.getId())
            .groupCode(commonCode.getCodeGroup().getGroupCode())
            .code(commonCode.getCode())
            .codeName(commonCode.getCodeName())
            .codeNameEn(commonCode.getCodeNameEn())
            .description(commonCode.getDescription())
            .extraValue1(commonCode.getExtraValue1())
            .extraValue2(commonCode.getExtraValue2())
            .extraValue3(commonCode.getExtraValue3())
            .active(commonCode.isActive())
            .sortOrder(commonCode.getSortOrder())
            .createdAt(commonCode.getCreatedAt())
            .updatedAt(commonCode.getUpdatedAt())
            .build();
    }
}
