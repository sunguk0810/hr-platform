package com.hrsaas.approval.domain.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * 대결(대리결재) 요청 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DelegateStepRequest {

    @NotNull(message = "대결자 ID는 필수입니다")
    private UUID delegateToId;

    @NotNull(message = "대결자 이름은 필수입니다")
    private String delegateToName;

    private String reason;
}
