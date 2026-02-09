package com.hrsaas.mdm.domain.dto.request;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 코드 그룹 수정 요청 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateCodeGroupRequest {

    @Size(max = 100, message = "그룹명은 100자 이하여야 합니다")
    private String groupName;

    @Size(max = 100, message = "영문 그룹명은 100자 이하여야 합니다")
    private String groupNameEn;

    @Size(max = 500, message = "설명은 500자 이하여야 합니다")
    private String description;

    private Boolean hierarchical;

    private Integer maxLevel;

    private Integer sortOrder;
}
