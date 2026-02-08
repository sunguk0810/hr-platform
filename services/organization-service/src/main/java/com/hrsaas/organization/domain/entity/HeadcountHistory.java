package com.hrsaas.organization.domain.entity;

import com.hrsaas.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

/**
 * 정원 이력 엔티티
 */
@Entity
@Table(name = "headcount_history", schema = "hr_core")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class HeadcountHistory extends BaseEntity {

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "plan_id", nullable = false)
    private UUID planId;

    @Column(name = "event_type", nullable = false, length = 50)
    private String eventType;

    @Column(name = "previous_value", columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String previousValue;

    @Column(name = "new_value", columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String newValue;

    @Column(name = "actor_id")
    private UUID actorId;

    @Column(name = "actor_name", length = 100)
    private String actorName;

    @Column(name = "event_date", nullable = false)
    private Instant eventDate;

    @Column(name = "created_at")
    private Instant createdAt;

    @PrePersist
    protected void onPrePersist() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
        if (this.eventDate == null) {
            this.eventDate = Instant.now();
        }
    }

    @Builder
    public HeadcountHistory(UUID tenantId, UUID planId, String eventType,
                             String previousValue, String newValue,
                             UUID actorId, String actorName, Instant eventDate) {
        this.tenantId = tenantId;
        this.planId = planId;
        this.eventType = eventType;
        this.previousValue = previousValue;
        this.newValue = newValue;
        this.actorId = actorId;
        this.actorName = actorName;
        this.eventDate = eventDate != null ? eventDate : Instant.now();
    }
}
