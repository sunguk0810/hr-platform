package com.hrsaas.organization.domain.dto.request;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DepartmentMergeRequest {

    @NotEmpty(message = "소스 부서 목록이 비어있습니다.")
    private List<UUID> sourceDepartmentIds;

    private UUID targetDepartmentId; // null이면 신규 생성

    private String targetDepartmentName;

    private String targetDepartmentCode;

    private String reason;

    private LocalDate effectiveDate;
}
