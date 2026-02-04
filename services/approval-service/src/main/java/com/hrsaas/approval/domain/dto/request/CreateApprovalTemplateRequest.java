package com.hrsaas.approval.domain.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateApprovalTemplateRequest {

    @NotBlank(message = "템플릿 코드는 필수입니다")
    @Size(max = 50)
    private String code;

    @NotBlank(message = "템플릿명은 필수입니다")
    @Size(max = 200)
    private String name;

    @NotBlank(message = "문서 유형은 필수입니다")
    @Size(max = 50)
    private String documentType;

    @Size(max = 500)
    private String description;

    private Integer sortOrder;

    @NotEmpty(message = "결재선은 최소 1개 이상 필요합니다")
    @Valid
    private List<ApprovalTemplateLineRequest> templateLines;
}
