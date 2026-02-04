package com.hrsaas.employee.domain.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 직원 일괄등록 요청 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkEmployeeImportRequest {

    @NotEmpty(message = "등록할 직원 목록이 필요합니다")
    @Size(max = 1000, message = "한 번에 최대 1000명까지 등록할 수 있습니다")
    @Valid
    private List<BulkEmployeeRequest> employees;

    /**
     * 검증만 수행 (실제 저장하지 않음)
     */
    @Builder.Default
    private boolean validateOnly = false;

    /**
     * 에러 발생 시 전체 롤백 여부
     */
    @Builder.Default
    private boolean rollbackOnError = true;

    /**
     * 중복 사번 건너뛰기 여부
     */
    @Builder.Default
    private boolean skipDuplicates = false;
}
