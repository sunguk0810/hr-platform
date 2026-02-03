package com.hrsaas.approval.domain.dto.request;

import com.hrsaas.approval.domain.entity.ApprovalLineType;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApprovalLineRequest {

    @NotNull(message = "결재자 ID는 필수입니다")
    private UUID approverId;

    private String approverName;
    private String approverPosition;
    private String approverDepartmentName;

    @Builder.Default
    private ApprovalLineType lineType = ApprovalLineType.SEQUENTIAL;
}
