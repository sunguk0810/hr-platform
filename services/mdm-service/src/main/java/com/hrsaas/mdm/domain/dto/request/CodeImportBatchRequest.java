package com.hrsaas.mdm.domain.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 코드 일괄 임포트 요청 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CodeImportBatchRequest {

    @NotEmpty(message = "임포트할 코드 목록이 필요합니다")
    @Valid
    private List<CodeImportRequest> codes;

    /**
     * 기존 코드 덮어쓰기 여부
     */
    @Builder.Default
    private boolean overwrite = false;

    /**
     * 검증만 수행 (실제 저장하지 않음)
     */
    @Builder.Default
    private boolean validateOnly = false;
}
