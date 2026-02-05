package com.hrsaas.employee.domain.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 테넌트 간소화 응답 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantSimpleResponse {
    private String id;
    private String name;
    private String code;
}
