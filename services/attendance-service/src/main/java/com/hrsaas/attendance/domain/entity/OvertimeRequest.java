package com.hrsaas.attendance.domain.entity;

import com.hrsaas.common.entity.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

@Entity
@Table(name = "overtime_request", schema = "hr_attendance")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class OvertimeRequest extends TenantAwareEntity {

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Column(name = "employee_name", nullable = false, length = 100)
    private String employeeName;

    @Column(name = "department_id")
    private UUID departmentId;

    @Column(name = "department_name", length = 200)
    private String departmentName;

    @Column(name = "overtime_date", nullable = false)
    private LocalDate overtimeDate;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @Column(name = "planned_hours", nullable = false, precision = 4, scale = 2)
    private BigDecimal plannedHours;

    @Column(name = "actual_hours", precision = 4, scale = 2)
    private BigDecimal actualHours;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private OvertimeStatus status = OvertimeStatus.PENDING;

    @Column(name = "reason", nullable = false, length = 500)
    private String reason;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    @Column(name = "approval_document_id")
    private UUID approvalDocumentId;

    @Builder
    public OvertimeRequest(UUID employeeId, String employeeName,
                           UUID departmentId, String departmentName,
                           LocalDate overtimeDate, LocalTime startTime, LocalTime endTime,
                           BigDecimal plannedHours, String reason) {
        this.employeeId = employeeId;
        this.employeeName = employeeName;
        this.departmentId = departmentId;
        this.departmentName = departmentName;
        this.overtimeDate = overtimeDate;
        this.startTime = startTime;
        this.endTime = endTime;
        this.plannedHours = plannedHours;
        this.reason = reason;
        this.status = OvertimeStatus.PENDING;
    }

    public void approve() {
        if (this.status != OvertimeStatus.PENDING) {
            throw new IllegalStateException("승인 대기 상태에서만 승인할 수 있습니다.");
        }
        this.status = OvertimeStatus.APPROVED;
    }

    public void reject(String rejectionReason) {
        if (this.status != OvertimeStatus.PENDING) {
            throw new IllegalStateException("승인 대기 상태에서만 반려할 수 있습니다.");
        }
        this.status = OvertimeStatus.REJECTED;
        this.rejectionReason = rejectionReason;
    }

    public void cancel() {
        if (this.status != OvertimeStatus.PENDING && this.status != OvertimeStatus.APPROVED) {
            throw new IllegalStateException("승인 대기 또는 승인 상태에서만 취소할 수 있습니다.");
        }
        this.status = OvertimeStatus.CANCELED;
    }

    public void complete(BigDecimal actualHours) {
        if (this.status != OvertimeStatus.APPROVED) {
            throw new IllegalStateException("승인된 상태에서만 완료 처리할 수 있습니다.");
        }
        this.actualHours = actualHours;
        this.status = OvertimeStatus.COMPLETED;
    }
}
