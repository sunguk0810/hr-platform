package com.hrsaas.mdm.domain.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 코드 임포트 요청 DTO (단일 코드 항목)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CodeImportRequest {

    @NotBlank(message = "코드 그룹 코드는 필수입니다")
    @Size(max = 50, message = "코드 그룹 코드는 50자 이하여야 합니다")
    private String groupCode;

    private String groupName;

    private String groupDescription;

    @NotBlank(message = "코드는 필수입니다")
    @Size(max = 50, message = "코드는 50자 이하여야 합니다")
    private String code;

    @NotBlank(message = "코드명은 필수입니다")
    @Size(max = 100, message = "코드명은 100자 이하여야 합니다")
    private String codeName;

    @Size(max = 100, message = "영문 코드명은 100자 이하여야 합니다")
    private String codeNameEn;

    @Size(max = 500, message = "설명은 500자 이하여야 합니다")
    private String description;

    @Size(max = 100, message = "추가값1은 100자 이하여야 합니다")
    private String extraValue1;

    @Size(max = 100, message = "추가값2은 100자 이하여야 합니다")
    private String extraValue2;

    @Size(max = 100, message = "추가값3은 100자 이하여야 합니다")
    private String extraValue3;

    private Integer sortOrder;
}
