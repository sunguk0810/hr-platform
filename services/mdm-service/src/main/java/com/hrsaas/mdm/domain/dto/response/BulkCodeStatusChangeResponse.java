package com.hrsaas.mdm.domain.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * 일괄 코드 상태 변경 결과 응답 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkCodeStatusChangeResponse {

    private int totalRequested;
    private int successCount;
    private int failedCount;

    @Builder.Default
    private List<BulkError> errors = new ArrayList<>();

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BulkError {
        private String codeId;
        private String message;
    }

    public void addError(String codeId, String message) {
        if (errors == null) {
            errors = new ArrayList<>();
        }
        errors.add(BulkError.builder().codeId(codeId).message(message).build());
    }
}
