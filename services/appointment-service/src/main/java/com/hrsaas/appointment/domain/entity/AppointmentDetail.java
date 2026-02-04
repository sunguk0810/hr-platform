package com.hrsaas.appointment.domain.entity;

import com.hrsaas.common.entity.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * 발령 상세 Entity
 */
@Entity
@Table(name = "appointment_detail", schema = "hr_appointment")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AppointmentDetail extends TenantAwareEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "draft_id", nullable = false)
    private AppointmentDraft draft;

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Column(name = "employee_name", length = 100)
    private String employeeName;

    @Column(name = "employee_number", length = 50)
    private String employeeNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "appointment_type", nullable = false, length = 30)
    private AppointmentType appointmentType;

    @Column(name = "from_department_id")
    private UUID fromDepartmentId;

    @Column(name = "from_department_name", length = 100)
    private String fromDepartmentName;

    @Column(name = "to_department_id")
    private UUID toDepartmentId;

    @Column(name = "to_department_name", length = 100)
    private String toDepartmentName;

    @Column(name = "from_position_code", length = 50)
    private String fromPositionCode;

    @Column(name = "from_position_name", length = 100)
    private String fromPositionName;

    @Column(name = "to_position_code", length = 50)
    private String toPositionCode;

    @Column(name = "to_position_name", length = 100)
    private String toPositionName;

    @Column(name = "from_grade_code", length = 50)
    private String fromGradeCode;

    @Column(name = "from_grade_name", length = 100)
    private String fromGradeName;

    @Column(name = "to_grade_code", length = 50)
    private String toGradeCode;

    @Column(name = "to_grade_name", length = 100)
    private String toGradeName;

    @Column(name = "from_job_code", length = 50)
    private String fromJobCode;

    @Column(name = "from_job_name", length = 100)
    private String fromJobName;

    @Column(name = "to_job_code", length = 50)
    private String toJobCode;

    @Column(name = "to_job_name", length = 100)
    private String toJobName;

    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private DetailStatus status = DetailStatus.PENDING;

    @Column(name = "executed_at")
    private Instant executedAt;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Builder
    public AppointmentDetail(UUID employeeId, String employeeName, String employeeNumber,
                             AppointmentType appointmentType,
                             UUID fromDepartmentId, String fromDepartmentName,
                             UUID toDepartmentId, String toDepartmentName,
                             String fromPositionCode, String fromPositionName,
                             String toPositionCode, String toPositionName,
                             String fromGradeCode, String fromGradeName,
                             String toGradeCode, String toGradeName,
                             String fromJobCode, String fromJobName,
                             String toJobCode, String toJobName,
                             String reason) {
        this.employeeId = employeeId;
        this.employeeName = employeeName;
        this.employeeNumber = employeeNumber;
        this.appointmentType = appointmentType;
        this.fromDepartmentId = fromDepartmentId;
        this.fromDepartmentName = fromDepartmentName;
        this.toDepartmentId = toDepartmentId;
        this.toDepartmentName = toDepartmentName;
        this.fromPositionCode = fromPositionCode;
        this.fromPositionName = fromPositionName;
        this.toPositionCode = toPositionCode;
        this.toPositionName = toPositionName;
        this.fromGradeCode = fromGradeCode;
        this.fromGradeName = fromGradeName;
        this.toGradeCode = toGradeCode;
        this.toGradeName = toGradeName;
        this.fromJobCode = fromJobCode;
        this.fromJobName = fromJobName;
        this.toJobCode = toJobCode;
        this.toJobName = toJobName;
        this.reason = reason;
        this.status = DetailStatus.PENDING;
    }

    public void execute() {
        this.status = DetailStatus.EXECUTED;
        this.executedAt = Instant.now();
    }

    public void fail(String errorMessage) {
        this.status = DetailStatus.FAILED;
        this.errorMessage = errorMessage;
    }

    public void cancel() {
        this.status = DetailStatus.CANCELLED;
    }

    public void rollback() {
        this.status = DetailStatus.ROLLED_BACK;
    }
}
