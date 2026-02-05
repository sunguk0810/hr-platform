package com.hrsaas.organization.domain.dto.response;

import com.hrsaas.organization.domain.entity.HeadcountPlan;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HeadcountPlanResponse {

    private UUID id;
    private Integer year;
    private UUID departmentId;
    private String departmentName;
    private Integer plannedCount;
    private Integer currentCount;
    private Integer approvedCount;
    private Integer variance;
    private Integer availableCount;
    private String notes;
    private Instant createdAt;
    private Instant updatedAt;

    public static HeadcountPlanResponse from(HeadcountPlan plan) {
        return HeadcountPlanResponse.builder()
            .id(plan.getId())
            .year(plan.getYear())
            .departmentId(plan.getDepartmentId())
            .departmentName(plan.getDepartmentName())
            .plannedCount(plan.getPlannedCount())
            .currentCount(plan.getCurrentCount())
            .approvedCount(plan.getApprovedCount())
            .variance(plan.getVariance())
            .availableCount(plan.getAvailableCount())
            .notes(plan.getNotes())
            .createdAt(plan.getCreatedAt())
            .updatedAt(plan.getUpdatedAt())
            .build();
    }
}
