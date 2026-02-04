package com.hrsaas.mdm.domain.dto.response;

import com.hrsaas.mdm.domain.entity.CommonCode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SimilarCodeResponse {

    private UUID id;
    private String groupCode;
    private String code;
    private String codeName;
    private String codeNameEn;
    private String description;
    private boolean active;
    private double similarity;
    private String matchedField;

    public static SimilarCodeResponse from(CommonCode code, double similarity, String matchedField) {
        return SimilarCodeResponse.builder()
            .id(code.getId())
            .groupCode(code.getCodeGroup().getGroupCode())
            .code(code.getCode())
            .codeName(code.getCodeName())
            .codeNameEn(code.getCodeNameEn())
            .description(code.getDescription())
            .active(code.isActive())
            .similarity(similarity)
            .matchedField(matchedField)
            .build();
    }
}
