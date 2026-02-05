package com.hrsaas.employee.domain.entity;

import com.hrsaas.common.entity.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * 경조비 정책 엔티티
 */
@Entity
@Table(name = "condolence_policy", schema = "hr_core")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CondolencePolicy extends TenantAwareEntity {

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 30)
    private CondolenceEventType eventType;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal amount = BigDecimal.ZERO;

    @Column(name = "leave_days", nullable = false)
    private Integer leaveDays = 0;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "sort_order")
    private Integer sortOrder;

    @Builder
    public CondolencePolicy(CondolenceEventType eventType, String name, String description,
                            BigDecimal amount, Integer leaveDays, Integer sortOrder) {
        this.eventType = eventType;
        this.name = name;
        this.description = description;
        this.amount = amount != null ? amount : BigDecimal.ZERO;
        this.leaveDays = leaveDays != null ? leaveDays : 0;
        this.isActive = true;
        this.sortOrder = sortOrder;
    }

    public void update(String name, String description, BigDecimal amount, Integer leaveDays, Integer sortOrder) {
        if (name != null) {
            this.name = name;
        }
        if (description != null) {
            this.description = description;
        }
        if (amount != null) {
            this.amount = amount;
        }
        if (leaveDays != null) {
            this.leaveDays = leaveDays;
        }
        if (sortOrder != null) {
            this.sortOrder = sortOrder;
        }
    }

    public void activate() {
        this.isActive = true;
    }

    public void deactivate() {
        this.isActive = false;
    }
}
