package com.hrsaas.organization.domain.dto.request;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdatePositionRequest {

    @Size(max = 100, message = "직책명은 100자를 초과할 수 없습니다")
    private String name;

    @Size(max = 100, message = "영문 직책명은 100자를 초과할 수 없습니다")
    private String nameEn;

    private Integer level;

    private Integer sortOrder;

    private Boolean isActive;
}
