package com.hrsaas.organization.domain.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HeadcountSummaryResponse {

    private Integer year;
    private Integer totalPlannedCount;
    private Integer totalCurrentCount;
    private Integer totalApprovedCount;
    private Integer totalVariance;
    private List<DepartmentSummary> departments;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DepartmentSummary {
        private UUID departmentId;
        private String departmentName;
        private Integer plannedCount;
        private Integer currentCount;
        private Integer approvedCount;
        private Integer variance;
        private Integer availableCount;
    }
}
