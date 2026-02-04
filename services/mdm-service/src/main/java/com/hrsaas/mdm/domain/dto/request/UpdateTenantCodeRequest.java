package com.hrsaas.mdm.domain.dto.request;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateTenantCodeRequest {

    @Size(max = 100, message = "코드명은 100자 이하여야 합니다.")
    private String customCodeName;

    @Size(max = 100, message = "영문 코드명은 100자 이하여야 합니다.")
    private String customCodeNameEn;

    @Size(max = 500, message = "설명은 500자 이하여야 합니다.")
    private String customDescription;

    private String customExtraValue1;
    private String customExtraValue2;
    private String customExtraValue3;
    private String customExtraJson;

    private Integer customSortOrder;

    private Boolean hidden;
}
