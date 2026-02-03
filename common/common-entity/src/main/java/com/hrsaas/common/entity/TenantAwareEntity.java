package com.hrsaas.common.entity;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.PrePersist;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.util.UUID;

/**
 * Entity with tenant isolation support.
 */
@MappedSuperclass
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
public abstract class TenantAwareEntity extends AuditableEntity {

    @Column(name = "tenant_id", nullable = false, updatable = false)
    private UUID tenantId;

    @PrePersist
    protected void prePersist() {
        if (this.tenantId == null) {
            UUID currentTenant = TenantContextHolder.getCurrentTenant();
            if (currentTenant != null) {
                this.tenantId = currentTenant;
            }
        }
        if (this.tenantId == null) {
            throw new IllegalStateException("Tenant ID must be set before persisting");
        }
    }
}
