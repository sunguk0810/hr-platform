package com.hrsaas.mdm.domain.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * 코드 폐기 요청 DTO (대체 코드 및 유예기간 지정)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeprecateCodeRequest {

    /**
     * 대체 코드 ID (선택)
     */
    private UUID replacementCodeId;

    /**
     * 유예기간 일수 (기본 90일)
     */
    private Integer gracePeriodDays;
}
