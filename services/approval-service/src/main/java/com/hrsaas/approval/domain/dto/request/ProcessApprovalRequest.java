package com.hrsaas.approval.domain.dto.request;

import com.hrsaas.approval.domain.entity.ApprovalActionType;
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
public class ProcessApprovalRequest {

    @NotNull(message = "결재 처리 유형은 필수입니다")
    private ApprovalActionType actionType;

    private String comment;

    private UUID delegateId;

    private String delegateName;
}
