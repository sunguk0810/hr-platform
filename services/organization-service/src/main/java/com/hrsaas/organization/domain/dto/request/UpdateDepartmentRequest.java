package com.hrsaas.organization.domain.dto.request;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateDepartmentRequest {

    @Size(max = 200, message = "부서명은 200자 이하여야 합니다.")
    private String name;

    @Size(max = 200, message = "영문 부서명은 200자 이하여야 합니다.")
    private String nameEn;

    private UUID parentId;

    private UUID managerId;

    private Integer sortOrder;
}
