package com.hrsaas.organization.domain.dto.request;

import jakarta.validation.constraints.NotBlank;
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
public class CreateDepartmentRequest {

    @NotBlank(message = "부서 코드를 입력해주세요.")
    @Size(max = 50, message = "부서 코드는 50자 이하여야 합니다.")
    private String code;

    @NotBlank(message = "부서명을 입력해주세요.")
    @Size(max = 200, message = "부서명은 200자 이하여야 합니다.")
    private String name;

    @Size(max = 200, message = "영문 부서명은 200자 이하여야 합니다.")
    private String nameEn;

    private UUID parentId;

    private UUID managerId;

    private Integer sortOrder;
}
