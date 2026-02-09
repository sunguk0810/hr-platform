package com.hrsaas.tenant.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "policy_change_history", schema = "tenant_common")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PolicyChangeHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "policy_type", nullable = false, length = 30)
    private String policyType;

    @Column(name = "action", nullable = false, length = 20)
    private String action;

    @Column(name = "before_value", columnDefinition = "TEXT")
    private String beforeValue;

    @Column(name = "after_value", nullable = false, columnDefinition = "TEXT")
    private String afterValue;

    @Column(name = "changed_by", length = 100)
    private String changedBy;

    @Column(name = "changed_by_name", length = 200)
    private String changedByName;

    @Column(name = "changed_at")
    private Instant changedAt;

    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason;

    @Column(name = "source_id")
    private UUID sourceId;

    @Column(name = "source_name", length = 200)
    private String sourceName;

    @Builder
    public PolicyChangeHistory(UUID tenantId, String policyType, String action,
                               String beforeValue, String afterValue,
                               String changedBy, String changedByName,
                               String reason, UUID sourceId, String sourceName) {
        this.tenantId = tenantId;
        this.policyType = policyType;
        this.action = action;
        this.beforeValue = beforeValue;
        this.afterValue = afterValue;
        this.changedBy = changedBy;
        this.changedByName = changedByName;
        this.changedAt = Instant.now();
        this.reason = reason;
        this.sourceId = sourceId;
        this.sourceName = sourceName;
    }
}
