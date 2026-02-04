package com.hrsaas.employee.domain.entity;

import com.hrsaas.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "employee_history", schema = "hr_core")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class EmployeeHistory extends BaseEntity {

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Enumerated(EnumType.STRING)
    @Column(name = "change_type", nullable = false, length = 30)
    private HistoryChangeType changeType;

    @Column(name = "from_department_id")
    private UUID fromDepartmentId;

    @Column(name = "to_department_id")
    private UUID toDepartmentId;

    @Column(name = "from_department_name", length = 200)
    private String fromDepartmentName;

    @Column(name = "to_department_name", length = 200)
    private String toDepartmentName;

    @Column(name = "from_grade_code", length = 50)
    private String fromGradeCode;

    @Column(name = "to_grade_code", length = 50)
    private String toGradeCode;

    @Column(name = "from_grade_name", length = 100)
    private String fromGradeName;

    @Column(name = "to_grade_name", length = 100)
    private String toGradeName;

    @Column(name = "from_position_code", length = 50)
    private String fromPositionCode;

    @Column(name = "to_position_code", length = 50)
    private String toPositionCode;

    @Column(name = "from_position_name", length = 100)
    private String fromPositionName;

    @Column(name = "to_position_name", length = 100)
    private String toPositionName;

    @Column(name = "effective_date", nullable = false)
    private LocalDate effectiveDate;

    @Column(name = "order_number", length = 100)
    private String orderNumber;

    @Column(name = "reason", length = 500)
    private String reason;

    @Column(name = "remarks", length = 1000)
    private String remarks;

    @Builder
    public EmployeeHistory(UUID employeeId, HistoryChangeType changeType,
                           UUID fromDepartmentId, UUID toDepartmentId,
                           String fromDepartmentName, String toDepartmentName,
                           String fromGradeCode, String toGradeCode,
                           String fromGradeName, String toGradeName,
                           String fromPositionCode, String toPositionCode,
                           String fromPositionName, String toPositionName,
                           LocalDate effectiveDate, String orderNumber,
                           String reason, String remarks) {
        this.employeeId = employeeId;
        this.changeType = changeType;
        this.fromDepartmentId = fromDepartmentId;
        this.toDepartmentId = toDepartmentId;
        this.fromDepartmentName = fromDepartmentName;
        this.toDepartmentName = toDepartmentName;
        this.fromGradeCode = fromGradeCode;
        this.toGradeCode = toGradeCode;
        this.fromGradeName = fromGradeName;
        this.toGradeName = toGradeName;
        this.fromPositionCode = fromPositionCode;
        this.toPositionCode = toPositionCode;
        this.fromPositionName = fromPositionName;
        this.toPositionName = toPositionName;
        this.effectiveDate = effectiveDate;
        this.orderNumber = orderNumber;
        this.reason = reason;
        this.remarks = remarks;
    }
}
