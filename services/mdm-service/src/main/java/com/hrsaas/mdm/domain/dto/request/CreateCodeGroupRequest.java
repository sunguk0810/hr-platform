package com.hrsaas.mdm.domain.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateCodeGroupRequest {

    @NotBlank(message = "그룹 코드를 입력해주세요.")
    @Size(max = 50, message = "그룹 코드는 50자 이하여야 합니다.")
    private String groupCode;

    @NotBlank(message = "그룹명을 입력해주세요.")
    @Size(max = 100, message = "그룹명은 100자 이하여야 합니다.")
    private String groupName;

    @Size(max = 100, message = "영문 그룹명은 100자 이하여야 합니다.")
    private String groupNameEn;

    @Size(max = 500, message = "설명은 500자 이하여야 합니다.")
    private String description;

    private Boolean hierarchical;

    private Integer maxLevel;

    private Integer sortOrder;
}
