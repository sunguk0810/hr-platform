package com.hrsaas.tenant.domain.dto.response;

import com.hrsaas.tenant.domain.entity.PolicyChangeHistory;
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
public class PolicyChangeHistoryResponse {

    private UUID id;
    private UUID tenantId;
    private String policyType;
    private String action;
    private String beforeValue;
    private String afterValue;
    private String changedBy;
    private String changedByName;
    private Instant changedAt;
    private String reason;
    private UUID sourceId;
    private String sourceName;

    public static PolicyChangeHistoryResponse from(PolicyChangeHistory history) {
        return PolicyChangeHistoryResponse.builder()
            .id(history.getId())
            .tenantId(history.getTenantId())
            .policyType(history.getPolicyType())
            .action(history.getAction())
            .beforeValue(history.getBeforeValue())
            .afterValue(history.getAfterValue())
            .changedBy(history.getChangedBy())
            .changedByName(history.getChangedByName())
            .changedAt(history.getChangedAt())
            .reason(history.getReason())
            .sourceId(history.getSourceId())
            .sourceName(history.getSourceName())
            .build();
    }
}
