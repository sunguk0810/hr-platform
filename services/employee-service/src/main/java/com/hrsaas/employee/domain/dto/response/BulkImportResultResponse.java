package com.hrsaas.employee.domain.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * 직원 일괄등록 결과 응답 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkImportResultResponse {

    private boolean success;
    private Instant processedAt;
    private int totalRequested;
    private int successCount;
    private int failedCount;
    private int skippedCount;

    @Builder.Default
    private List<ImportedEmployee> importedEmployees = new ArrayList<>();

    @Builder.Default
    private List<ImportError> errors = new ArrayList<>();

    @Builder.Default
    private List<ImportWarning> warnings = new ArrayList<>();

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ImportedEmployee {
        private int rowNumber;
        private UUID id;
        private String employeeNumber;
        private String name;
        private String email;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ImportError {
        private int rowNumber;
        private String employeeNumber;
        private String name;
        private String field;
        private String message;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ImportWarning {
        private int rowNumber;
        private String employeeNumber;
        private String message;
    }

    public void addImportedEmployee(int rowNumber, UUID id, String employeeNumber, String name, String email) {
        if (importedEmployees == null) {
            importedEmployees = new ArrayList<>();
        }
        importedEmployees.add(ImportedEmployee.builder()
            .rowNumber(rowNumber)
            .id(id)
            .employeeNumber(employeeNumber)
            .name(name)
            .email(email)
            .build());
    }

    public void addError(int rowNumber, String employeeNumber, String name, String field, String message) {
        if (errors == null) {
            errors = new ArrayList<>();
        }
        errors.add(ImportError.builder()
            .rowNumber(rowNumber)
            .employeeNumber(employeeNumber)
            .name(name)
            .field(field)
            .message(message)
            .build());
    }

    public void addWarning(int rowNumber, String employeeNumber, String message) {
        if (warnings == null) {
            warnings = new ArrayList<>();
        }
        warnings.add(ImportWarning.builder()
            .rowNumber(rowNumber)
            .employeeNumber(employeeNumber)
            .message(message)
            .build());
    }

    public boolean hasErrors() {
        return errors != null && !errors.isEmpty();
    }
}
