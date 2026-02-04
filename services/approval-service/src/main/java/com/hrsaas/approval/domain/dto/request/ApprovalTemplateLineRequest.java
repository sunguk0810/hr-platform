package com.hrsaas.approval.domain.dto.request;

import com.hrsaas.approval.domain.entity.ApprovalLineType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApprovalTemplateLineRequest {

    private ApprovalLineType lineType;

    @NotBlank(message = "결재자 유형은 필수입니다")
    @Size(max = 30)
    private String approverType; // SPECIFIC_USER, DEPARTMENT_HEAD, POSITION_HOLDER, DRAFTER_MANAGER

    private UUID approverId;

    @Size(max = 100)
    private String approverName;

    @Size(max = 50)
    private String positionCode;

    private UUID departmentId;

    @Size(max = 200)
    private String description;
}
