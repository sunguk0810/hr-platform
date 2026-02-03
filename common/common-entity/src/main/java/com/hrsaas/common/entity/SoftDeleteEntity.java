package com.hrsaas.common.entity;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.SQLRestriction;

import java.time.Instant;
import java.util.UUID;

/**
 * Entity with soft delete support.
 */
@MappedSuperclass
@Getter
@Setter
@SQLRestriction("deleted_at IS NULL")
public abstract class SoftDeleteEntity extends TenantAwareEntity {

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @Column(name = "deleted_by")
    private UUID deletedBy;

    public boolean isDeleted() {
        return deletedAt != null;
    }

    public void softDelete() {
        this.deletedAt = Instant.now();
        this.deletedBy = SecurityContextHolder.getCurrentUserId();
    }

    public void restore() {
        this.deletedAt = null;
        this.deletedBy = null;
    }
}
