package com.hrsaas.approval.domain.dto.request;

import jakarta.validation.Valid;
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
public class UpdateApprovalTemplateRequest {

    @Size(max = 200)
    private String name;

    @Size(max = 500)
    private String description;

    private Integer sortOrder;

    private Boolean isActive;

    @Valid
    private List<ApprovalTemplateLineRequest> templateLines;
}
