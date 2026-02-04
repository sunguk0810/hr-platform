package com.hrsaas.mdm.domain.dto.request;

import com.hrsaas.mdm.domain.entity.CodeStatus;
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
public class UpdateCommonCodeRequest {

    private UUID parentCodeId;

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

    private CodeStatus status;

    private Integer sortOrder;
}
