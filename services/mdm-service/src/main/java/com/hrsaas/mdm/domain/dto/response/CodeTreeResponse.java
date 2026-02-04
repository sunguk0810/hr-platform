package com.hrsaas.mdm.domain.dto.response;

import com.hrsaas.mdm.domain.entity.CodeStatus;
import com.hrsaas.mdm.domain.entity.CommonCode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * 계층형 코드 트리 응답
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CodeTreeResponse {

    private UUID id;
    private String code;
    private String codeName;
    private String codeNameEn;
    private String description;
    private Integer level;
    private UUID parentCodeId;
    private CodeStatus status;
    private boolean active;
    private Integer sortOrder;
    private boolean hasChildren;
    private List<CodeTreeResponse> children;

    public static CodeTreeResponse from(CommonCode code) {
        return CodeTreeResponse.builder()
            .id(code.getId())
            .code(code.getCode())
            .codeName(code.getCodeName())
            .codeNameEn(code.getCodeNameEn())
            .description(code.getDescription())
            .level(code.getLevel())
            .parentCodeId(code.getParentCodeId())
            .status(code.getStatus())
            .active(code.isActive())
            .sortOrder(code.getSortOrder())
            .hasChildren(code.getChildCodes() != null && !code.getChildCodes().isEmpty())
            .children(new ArrayList<>())
            .build();
    }

    public static CodeTreeResponse fromWithChildren(CommonCode code) {
        CodeTreeResponse response = from(code);
        if (code.getChildCodes() != null && !code.getChildCodes().isEmpty()) {
            response.setChildren(code.getChildCodes().stream()
                .map(CodeTreeResponse::fromWithChildren)
                .toList());
        }
        return response;
    }

    public void addChild(CodeTreeResponse child) {
        if (this.children == null) {
            this.children = new ArrayList<>();
        }
        this.children.add(child);
        this.hasChildren = true;
    }
}
