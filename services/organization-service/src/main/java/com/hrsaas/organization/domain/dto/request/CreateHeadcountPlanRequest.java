package com.hrsaas.organization.domain.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateHeadcountPlanRequest {

    @NotNull(message = "연도를 입력해주세요.")
    @Min(value = 2020, message = "연도는 2020년 이상이어야 합니다.")
    private Integer year;

    @NotNull(message = "부서 ID를 입력해주세요.")
    private UUID departmentId;

    private String departmentName;

    @NotNull(message = "계획 인원을 입력해주세요.")
    @Min(value = 0, message = "계획 인원은 0 이상이어야 합니다.")
    private Integer plannedCount;

    private Integer currentCount;

    private String notes;
}
