package com.hrsaas.approval.domain.dto.request;

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
public class UpdateDelegationRuleRequest {

    private UUID delegateId;

    @Size(max = 100)
    private String delegateName;

    private LocalDate startDate;

    private LocalDate endDate;

    @Size(max = 500)
    private String documentTypes;

    @Size(max = 500)
    private String reason;
}
