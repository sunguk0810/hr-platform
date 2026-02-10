package com.hrsaas.approval.domain.dto.request;

import com.hrsaas.approval.domain.entity.ApprovalActionType;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BatchApprovalRequest {

    @NotNull(message = "처리 유형은 필수입니다")
    private ApprovalActionType actionType;

    @NotEmpty(message = "문서 ID 목록은 필수입니다")
    private List<UUID> documentIds;

    private String comment;
}
