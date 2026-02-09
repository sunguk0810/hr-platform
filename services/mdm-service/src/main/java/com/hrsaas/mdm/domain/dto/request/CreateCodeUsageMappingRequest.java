package com.hrsaas.mdm.domain.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 코드 사용처 매핑 생성 요청 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateCodeUsageMappingRequest {

    @NotBlank(message = "그룹 코드는 필수입니다")
    @Size(max = 50)
    private String groupCode;

    @NotBlank(message = "리소스 유형은 필수입니다")
    @Size(max = 20)
    private String resourceType;

    @NotBlank(message = "리소스명은 필수입니다")
    @Size(max = 100)
    private String resourceName;

    @Size(max = 500)
    private String description;

    @Size(max = 20)
    private String estimatedImpact;
}
