package com.hrsaas.approval.domain.dto.response;

import com.hrsaas.approval.domain.entity.DelegationRule;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DelegationRuleResponse {

    private UUID id;
    private UUID delegatorId;
    private String delegatorName;
    private UUID delegateId;
    private String delegateName;
    private LocalDate startDate;
    private LocalDate endDate;
    private String documentTypes;
    private String reason;
    private Boolean isActive;
    private Boolean isEffective;
    private Instant createdAt;

    public static DelegationRuleResponse from(DelegationRule rule) {
        return DelegationRuleResponse.builder()
            .id(rule.getId())
            .delegatorId(rule.getDelegatorId())
            .delegatorName(rule.getDelegatorName())
            .delegateId(rule.getDelegateId())
            .delegateName(rule.getDelegateName())
            .startDate(rule.getStartDate())
            .endDate(rule.getEndDate())
            .documentTypes(rule.getDocumentTypes())
            .reason(rule.getReason())
            .isActive(rule.getIsActive())
            .isEffective(rule.isEffective())
            .createdAt(rule.getCreatedAt())
            .build();
    }
}
