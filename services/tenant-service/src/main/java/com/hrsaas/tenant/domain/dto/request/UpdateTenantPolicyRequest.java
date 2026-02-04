package com.hrsaas.tenant.domain.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateTenantPolicyRequest {

    @NotBlank(message = "정책 데이터는 필수입니다")
    private String policyData; // JSON format

    private Boolean isActive;
}
