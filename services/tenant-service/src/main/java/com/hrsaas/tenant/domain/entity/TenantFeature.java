package com.hrsaas.tenant.domain.entity;

import com.hrsaas.common.entity.AuditableEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "tenant_feature", schema = "tenant_common",
       uniqueConstraints = @UniqueConstraint(columnNames = {"tenant_id", "feature_code"}))
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TenantFeature extends AuditableEntity {

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "feature_code", nullable = false, length = 50)
    private String featureCode; // APPROVAL, ATTENDANCE, RECRUITMENT, etc.

    @Column(name = "is_enabled", nullable = false)
    private Boolean isEnabled = false;

    @Column(name = "config", columnDefinition = "TEXT")
    private String config; // Feature-specific configuration JSON

    @Builder
    public TenantFeature(UUID tenantId, String featureCode, Boolean isEnabled, String config) {
        this.tenantId = tenantId;
        this.featureCode = featureCode;
        this.isEnabled = isEnabled != null ? isEnabled : false;
        this.config = config;
    }

    public void enable() {
        this.isEnabled = true;
    }

    public void disable() {
        this.isEnabled = false;
    }

    public void updateConfig(String config) {
        this.config = config;
    }
}
