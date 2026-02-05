package com.hrsaas.employee.domain.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateCondolencePolicyRequest {

    @Size(max = 100, message = "정책명은 100자 이하여야 합니다.")
    private String name;

    @Size(max = 500, message = "설명은 500자 이하여야 합니다.")
    private String description;

    @Min(value = 0, message = "지급 금액은 0 이상이어야 합니다.")
    private BigDecimal amount;

    @Min(value = 0, message = "휴가 일수는 0 이상이어야 합니다.")
    private Integer leaveDays;

    private Integer sortOrder;

    private Boolean isActive;
}
