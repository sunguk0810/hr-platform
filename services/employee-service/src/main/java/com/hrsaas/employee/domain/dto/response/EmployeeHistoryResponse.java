package com.hrsaas.employee.domain.dto.response;

import com.hrsaas.employee.domain.entity.EmployeeHistory;
import com.hrsaas.employee.domain.entity.HistoryChangeType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeHistoryResponse {

    private UUID id;
    private UUID employeeId;
    private HistoryChangeType changeType;
    private UUID fromDepartmentId;
    private UUID toDepartmentId;
    private String fromDepartmentName;
    private String toDepartmentName;
    private String fromGradeCode;
    private String toGradeCode;
    private String fromGradeName;
    private String toGradeName;
    private String fromPositionCode;
    private String toPositionCode;
    private String fromPositionName;
    private String toPositionName;
    private LocalDate effectiveDate;
    private String orderNumber;
    private String reason;
    private String remarks;
    private Instant createdAt;

    public static EmployeeHistoryResponse from(EmployeeHistory history) {
        return EmployeeHistoryResponse.builder()
            .id(history.getId())
            .employeeId(history.getEmployeeId())
            .changeType(history.getChangeType())
            .fromDepartmentId(history.getFromDepartmentId())
            .toDepartmentId(history.getToDepartmentId())
            .fromDepartmentName(history.getFromDepartmentName())
            .toDepartmentName(history.getToDepartmentName())
            .fromGradeCode(history.getFromGradeCode())
            .toGradeCode(history.getToGradeCode())
            .fromGradeName(history.getFromGradeName())
            .toGradeName(history.getToGradeName())
            .fromPositionCode(history.getFromPositionCode())
            .toPositionCode(history.getToPositionCode())
            .fromPositionName(history.getFromPositionName())
            .toPositionName(history.getToPositionName())
            .effectiveDate(history.getEffectiveDate())
            .orderNumber(history.getOrderNumber())
            .reason(history.getReason())
            .remarks(history.getRemarks())
            .createdAt(history.getCreatedAt())
            .build();
    }
}
