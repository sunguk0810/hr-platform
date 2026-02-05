package com.hrsaas.organization.domain.dto.request;

import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateHeadcountPlanRequest {

    @Min(value = 0, message = "계획 인원은 0 이상이어야 합니다.")
    private Integer plannedCount;

    private String notes;
}
