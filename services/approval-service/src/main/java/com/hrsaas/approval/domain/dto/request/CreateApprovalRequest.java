package com.hrsaas.approval.domain.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateApprovalRequest {

    @NotBlank(message = "제목은 필수입니다")
    private String title;

    private String content;

    @NotBlank(message = "문서 유형은 필수입니다")
    private String documentType;

    private String referenceType;

    private UUID referenceId;

    @NotEmpty(message = "결재선은 필수입니다")
    @Valid
    private List<ApprovalLineRequest> approvalLines;

    private boolean submitImmediately;

    private Instant deadlineAt;
}
