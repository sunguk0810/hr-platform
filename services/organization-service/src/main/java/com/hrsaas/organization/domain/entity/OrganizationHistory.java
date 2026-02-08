package com.hrsaas.organization.domain.entity;

import com.hrsaas.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * 조직 변경 이력 엔티티
 */
@Entity
@Table(name = "organization_history", schema = "hr_core")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class OrganizationHistory extends BaseEntity {

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "event_type", nullable = false, length = 50)
    private String eventType;

    @Column(name = "department_id")
    private UUID departmentId;

    @Column(name = "department_name", length = 200)
    private String departmentName;

    @Column(name = "title", nullable = false, length = 500)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

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

    @Column(name = "metadata", columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String metadata;

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
    public OrganizationHistory(UUID tenantId, String eventType, UUID departmentId,
                                String departmentName, String title, String description,
                                String previousValue, String newValue,
                                UUID actorId, String actorName, Instant eventDate,
                                String metadata) {
        this.tenantId = tenantId;
        this.eventType = eventType;
        this.departmentId = departmentId;
        this.departmentName = departmentName;
        this.title = title;
        this.description = description;
        this.previousValue = previousValue;
        this.newValue = newValue;
        this.actorId = actorId;
        this.actorName = actorName;
        this.eventDate = eventDate != null ? eventDate : Instant.now();
        this.metadata = metadata;
    }
}
