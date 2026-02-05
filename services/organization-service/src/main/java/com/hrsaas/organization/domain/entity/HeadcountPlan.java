package com.hrsaas.organization.domain.entity;

import com.hrsaas.common.entity.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

/**
 * 정현원 계획 엔티티
 */
@Entity
@Table(name = "headcount_plan", schema = "hr_core")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class HeadcountPlan extends TenantAwareEntity {

    @Column(name = "year", nullable = false)
    private Integer year;

    @Column(name = "department_id", nullable = false)
    private UUID departmentId;

    @Column(name = "department_name", length = 200)
    private String departmentName;

    @Column(name = "planned_count", nullable = false)
    private Integer plannedCount = 0;

    @Column(name = "current_count", nullable = false)
    private Integer currentCount = 0;

    @Column(name = "approved_count", nullable = false)
    private Integer approvedCount = 0;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Builder
    public HeadcountPlan(Integer year, UUID departmentId, String departmentName,
                         Integer plannedCount, Integer currentCount, String notes) {
        this.year = year;
        this.departmentId = departmentId;
        this.departmentName = departmentName;
        this.plannedCount = plannedCount != null ? plannedCount : 0;
        this.currentCount = currentCount != null ? currentCount : 0;
        this.approvedCount = 0;
        this.notes = notes;
    }

    public void update(Integer plannedCount, String notes) {
        if (plannedCount != null) {
            this.plannedCount = plannedCount;
        }
        if (notes != null) {
            this.notes = notes;
        }
    }

    public void updateCurrentCount(Integer currentCount) {
        this.currentCount = currentCount != null ? currentCount : 0;
    }

    public void incrementApprovedCount(int count) {
        this.approvedCount += count;
    }

    public int getVariance() {
        return this.plannedCount - this.currentCount;
    }

    public int getAvailableCount() {
        return this.plannedCount - this.approvedCount;
    }
}
