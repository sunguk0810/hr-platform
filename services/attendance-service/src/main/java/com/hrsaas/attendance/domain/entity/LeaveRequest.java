package com.hrsaas.attendance.domain.entity;

import com.hrsaas.common.entity.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "leave_request", schema = "hr_attendance")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class LeaveRequest extends TenantAwareEntity {

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Column(name = "employee_name", nullable = false)
    private String employeeName;

    @Column(name = "department_id")
    private UUID departmentId;

    @Column(name = "department_name")
    private String departmentName;

    @Enumerated(EnumType.STRING)
    @Column(name = "leave_type", nullable = false)
    private LeaveType leaveType;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "days_count", nullable = false, precision = 3, scale = 1)
    private BigDecimal daysCount;

    @Enumerated(EnumType.STRING)
    @Column(name = "leave_unit", length = 10)
    @Builder.Default
    private LeaveUnit leaveUnit = LeaveUnit.DAY;

    @Column(name = "hours_count", precision = 5, scale = 1)
    private BigDecimal hoursCount;

    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private LeaveStatus status = LeaveStatus.DRAFT;

    @Column(name = "approval_document_id")
    private UUID approvalDocumentId;

    @Column(name = "emergency_contact")
    private String emergencyContact;

    @Column(name = "handover_to_id")
    private UUID handoverToId;

    @Column(name = "handover_to_name")
    private String handoverToName;

    @Column(name = "handover_notes", columnDefinition = "TEXT")
    private String handoverNotes;

    public void submit(UUID approvalDocumentId) {
        if (this.status != LeaveStatus.DRAFT) {
            throw new IllegalStateException("Only draft requests can be submitted");
        }
        this.status = LeaveStatus.PENDING;
        this.approvalDocumentId = approvalDocumentId;
    }

    public void approve() {
        if (this.status != LeaveStatus.PENDING) {
            throw new IllegalStateException("Only pending requests can be approved");
        }
        this.status = LeaveStatus.APPROVED;
    }

    public void reject() {
        if (this.status != LeaveStatus.PENDING) {
            throw new IllegalStateException("Only pending requests can be rejected");
        }
        this.status = LeaveStatus.REJECTED;
    }

    public void cancel() {
        if (this.status != LeaveStatus.DRAFT && this.status != LeaveStatus.PENDING && this.status != LeaveStatus.APPROVED) {
            throw new IllegalStateException("This request cannot be canceled");
        }
        this.status = LeaveStatus.CANCELED;
    }
}
