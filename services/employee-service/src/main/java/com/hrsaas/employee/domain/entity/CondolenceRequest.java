package com.hrsaas.employee.domain.entity;

import com.hrsaas.common.entity.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * 경조비 신청 엔티티
 */
@Entity
@Table(name = "condolence_request", schema = "hr_core")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CondolenceRequest extends TenantAwareEntity {

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Column(name = "employee_name", length = 100)
    private String employeeName;

    @Column(name = "department_name", length = 200)
    private String departmentName;

    @Column(name = "policy_id")
    private UUID policyId;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 30)
    private CondolenceEventType eventType;

    @Column(name = "event_date", nullable = false)
    private LocalDate eventDate;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "relation", length = 50)
    private String relation;

    @Column(name = "related_person_name", length = 100)
    private String relatedPersonName;

    @Column(name = "amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal amount = BigDecimal.ZERO;

    @Column(name = "leave_days")
    private Integer leaveDays;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private CondolenceStatus status = CondolenceStatus.PENDING;

    @Column(name = "approval_id")
    private UUID approvalId;

    @Column(name = "paid_date")
    private LocalDate paidDate;

    @Column(name = "reject_reason", length = 500)
    private String rejectReason;

    @Builder
    public CondolenceRequest(UUID employeeId, String employeeName, String departmentName,
                             UUID policyId, CondolenceEventType eventType, LocalDate eventDate,
                             String description, String relation, String relatedPersonName,
                             BigDecimal amount, Integer leaveDays) {
        this.employeeId = employeeId;
        this.employeeName = employeeName;
        this.departmentName = departmentName;
        this.policyId = policyId;
        this.eventType = eventType;
        this.eventDate = eventDate;
        this.description = description;
        this.relation = relation;
        this.relatedPersonName = relatedPersonName;
        this.amount = amount != null ? amount : BigDecimal.ZERO;
        this.leaveDays = leaveDays;
        this.status = CondolenceStatus.PENDING;
    }

    public void update(LocalDate eventDate, String description, String relation,
                       String relatedPersonName) {
        if (eventDate != null) {
            this.eventDate = eventDate;
        }
        if (description != null) {
            this.description = description;
        }
        if (relation != null) {
            this.relation = relation;
        }
        if (relatedPersonName != null) {
            this.relatedPersonName = relatedPersonName;
        }
    }

    public void approve(UUID approvalId) {
        this.status = CondolenceStatus.APPROVED;
        this.approvalId = approvalId;
    }

    public void reject(String reason) {
        this.status = CondolenceStatus.REJECTED;
        this.rejectReason = reason;
    }

    public void markAsPaid(LocalDate paidDate) {
        this.status = CondolenceStatus.PAID;
        this.paidDate = paidDate;
    }

    public void cancel() {
        this.status = CondolenceStatus.CANCELLED;
    }

    public boolean isPending() {
        return this.status == CondolenceStatus.PENDING;
    }

    public boolean isApproved() {
        return this.status == CondolenceStatus.APPROVED;
    }

    public boolean canBeModified() {
        return this.status == CondolenceStatus.PENDING;
    }
}
