package com.hrsaas.approval.domain.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
public class CreateDelegationRuleRequest {

    @NotNull(message = "대리자 ID는 필수입니다")
    private UUID delegateId;

    @NotBlank(message = "대리자명은 필수입니다")
    @Size(max = 100)
    private String delegateName;

    @NotNull(message = "시작일은 필수입니다")
    private LocalDate startDate;

    @NotNull(message = "종료일은 필수입니다")
    private LocalDate endDate;

    @Size(max = 500)
    private String documentTypes; // comma-separated list, null means all types

    @Size(max = 500)
    private String reason;
}
