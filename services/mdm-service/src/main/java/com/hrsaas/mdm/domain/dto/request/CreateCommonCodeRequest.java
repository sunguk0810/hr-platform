package com.hrsaas.mdm.domain.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateCommonCodeRequest {

    @NotNull(message = "코드 그룹 ID를 입력해주세요.")
    private UUID codeGroupId;

    private UUID parentCodeId;

    @NotBlank(message = "코드를 입력해주세요.")
    @Size(max = 50, message = "코드는 50자 이하여야 합니다.")
    private String code;

    @NotBlank(message = "코드명을 입력해주세요.")
    @Size(max = 100, message = "코드명은 100자 이하여야 합니다.")
    private String codeName;

    @Size(max = 100, message = "영문 코드명은 100자 이하여야 합니다.")
    private String codeNameEn;

    @Size(max = 500, message = "설명은 500자 이하여야 합니다.")
    private String description;

    private String extraValue1;
    private String extraValue2;
    private String extraValue3;
    private String extraJson;

    private Boolean defaultCode;

    private LocalDate effectiveFrom;
    private LocalDate effectiveTo;

    private Integer sortOrder;
}
