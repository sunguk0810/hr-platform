package com.hrsaas.employee.domain.dto.response;

import com.hrsaas.employee.domain.entity.CondolenceEventType;
import com.hrsaas.employee.domain.entity.CondolencePolicy;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CondolencePolicyResponse {

    private UUID id;
    private CondolenceEventType eventType;
    private String name;
    private String description;
    private BigDecimal amount;
    private Integer leaveDays;
    private Boolean isActive;
    private Integer sortOrder;
    private Instant createdAt;
    private Instant updatedAt;

    public static CondolencePolicyResponse from(CondolencePolicy policy) {
        return CondolencePolicyResponse.builder()
            .id(policy.getId())
            .eventType(policy.getEventType())
            .name(policy.getName())
            .description(policy.getDescription())
            .amount(policy.getAmount())
            .leaveDays(policy.getLeaveDays())
            .isActive(policy.getIsActive())
            .sortOrder(policy.getSortOrder())
            .createdAt(policy.getCreatedAt())
            .updatedAt(policy.getUpdatedAt())
            .build();
    }
}
