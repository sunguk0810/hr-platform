package com.hrsaas.tenant.domain.dto.response;

import com.hrsaas.tenant.domain.entity.PolicyType;
import com.hrsaas.tenant.domain.entity.TenantPolicy;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantPolicyResponse {

    private UUID id;
    private UUID tenantId;
    private PolicyType policyType;
    private String policyData;
    private Boolean isActive;
    private Instant createdAt;
    private Instant updatedAt;

    public static TenantPolicyResponse from(TenantPolicy policy) {
        return TenantPolicyResponse.builder()
            .id(policy.getId())
            .tenantId(policy.getTenantId())
            .policyType(policy.getPolicyType())
            .policyData(policy.getPolicyData())
            .isActive(policy.getIsActive())
            .createdAt(policy.getCreatedAt())
            .updatedAt(policy.getUpdatedAt())
            .build();
    }
}
