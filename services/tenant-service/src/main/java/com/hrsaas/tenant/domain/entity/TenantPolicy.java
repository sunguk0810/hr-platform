package com.hrsaas.tenant.domain.entity;

import com.hrsaas.common.entity.AuditableEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "tenant_policy", schema = "tenant_common",
       uniqueConstraints = @UniqueConstraint(columnNames = {"tenant_id", "policy_type"}))
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TenantPolicy extends AuditableEntity {

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Enumerated(EnumType.STRING)
    @Column(name = "policy_type", nullable = false, length = 30)
    private PolicyType policyType;

    @Column(name = "policy_data", columnDefinition = "TEXT")
    private String policyData; // JSON format

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Builder
    public TenantPolicy(UUID tenantId, PolicyType policyType, String policyData) {
        this.tenantId = tenantId;
        this.policyType = policyType;
        this.policyData = policyData;
        this.isActive = true;
    }

    public void updatePolicyData(String policyData) {
        this.policyData = policyData;
    }

    public void activate() {
        this.isActive = true;
    }

    public void deactivate() {
        this.isActive = false;
    }
}
