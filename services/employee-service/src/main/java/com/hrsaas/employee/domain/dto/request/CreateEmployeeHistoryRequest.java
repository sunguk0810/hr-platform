package com.hrsaas.employee.domain.dto.request;

import com.hrsaas.employee.domain.entity.HistoryChangeType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateEmployeeHistoryRequest {

    @NotNull(message = "변경 유형은 필수입니다")
    private HistoryChangeType changeType;

    private UUID fromDepartmentId;
    private UUID toDepartmentId;
    private String fromDepartmentName;
    private String toDepartmentName;

    @Size(max = 50)
    private String fromGradeCode;
    @Size(max = 50)
    private String toGradeCode;
    private String fromGradeName;
    private String toGradeName;

    @Size(max = 50)
    private String fromPositionCode;
    @Size(max = 50)
    private String toPositionCode;
    private String fromPositionName;
    private String toPositionName;

    @NotNull(message = "발령일은 필수입니다")
    private LocalDate effectiveDate;

    @Size(max = 100)
    private String orderNumber;

    @Size(max = 500)
    private String reason;

    @Size(max = 1000)
    private String remarks;
}
