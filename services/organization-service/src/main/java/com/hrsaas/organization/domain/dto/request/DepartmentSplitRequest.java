package com.hrsaas.organization.domain.dto.request;

import jakarta.validation.constraints.NotNull;
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
public class DepartmentSplitRequest {

    @NotNull(message = "소스 부서 ID가 필요합니다.")
    private UUID sourceDepartmentId;

    private List<SplitTarget> newDepartments;

    private boolean keepSource;

    private String reason;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SplitTarget {
        private String name;
        private String code;
        private List<UUID> employeeIds;
    }
}
