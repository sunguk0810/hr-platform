package com.hrsaas.mdm.domain.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * 코드 임포트 결과 응답 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImportResultResponse {

    private boolean success;
    private Instant importedAt;
    private int totalRequested;
    private int groupsCreated;
    private int groupsUpdated;
    private int codesCreated;
    private int codesUpdated;
    private int codesSkipped;

    @Builder.Default
    private List<ImportError> errors = new ArrayList<>();

    @Builder.Default
    private List<ImportWarning> warnings = new ArrayList<>();

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ImportError {
        private int rowNumber;
        private String groupCode;
        private String code;
        private String message;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ImportWarning {
        private int rowNumber;
        private String groupCode;
        private String code;
        private String message;
    }

    public void addError(int rowNumber, String groupCode, String code, String message) {
        if (errors == null) {
            errors = new ArrayList<>();
        }
        errors.add(ImportError.builder()
            .rowNumber(rowNumber)
            .groupCode(groupCode)
            .code(code)
            .message(message)
            .build());
    }

    public void addWarning(int rowNumber, String groupCode, String code, String message) {
        if (warnings == null) {
            warnings = new ArrayList<>();
        }
        warnings.add(ImportWarning.builder()
            .rowNumber(rowNumber)
            .groupCode(groupCode)
            .code(code)
            .message(message)
            .build());
    }

    public boolean hasErrors() {
        return errors != null && !errors.isEmpty();
    }
}
