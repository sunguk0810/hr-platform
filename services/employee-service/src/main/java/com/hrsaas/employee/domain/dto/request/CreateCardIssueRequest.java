package com.hrsaas.employee.domain.dto.request;

import com.hrsaas.employee.domain.entity.CardIssueType;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateCardIssueRequest {

    @NotNull(message = "발급 유형을 선택해주세요.")
    private CardIssueType issueType;

    private String reason;
}
