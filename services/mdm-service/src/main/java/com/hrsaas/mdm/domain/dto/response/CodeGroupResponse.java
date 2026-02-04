package com.hrsaas.mdm.domain.dto.response;

import com.hrsaas.mdm.domain.entity.CodeGroup;
import com.hrsaas.mdm.domain.entity.CodeStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CodeGroupResponse {

    private UUID id;
    private String groupCode;
    private String groupName;
    private String groupNameEn;
    private String description;
    private boolean system;
    private boolean hierarchical;
    private Integer maxLevel;
    private CodeStatus status;
    private boolean active;
    private Integer sortOrder;
    private List<CommonCodeResponse> codes;
    private Instant createdAt;
    private Instant updatedAt;

    public static CodeGroupResponse from(CodeGroup codeGroup) {
        return CodeGroupResponse.builder()
            .id(codeGroup.getId())
            .groupCode(codeGroup.getGroupCode())
            .groupName(codeGroup.getGroupName())
            .groupNameEn(codeGroup.getGroupNameEn())
            .description(codeGroup.getDescription())
            .system(codeGroup.isSystem())
            .hierarchical(codeGroup.isHierarchical())
            .maxLevel(codeGroup.getMaxLevel())
            .status(codeGroup.getStatus())
            .active(codeGroup.isActive())
            .sortOrder(codeGroup.getSortOrder())
            .createdAt(codeGroup.getCreatedAt())
            .updatedAt(codeGroup.getUpdatedAt())
            .build();
    }

    public static CodeGroupResponse fromWithCodes(CodeGroup codeGroup) {
        CodeGroupResponse response = from(codeGroup);
        response.setCodes(codeGroup.getCodes().stream()
            .map(CommonCodeResponse::from)
            .toList());
        return response;
    }
}
