package com.hrsaas.employee.domain.entity;

import com.hrsaas.common.entity.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.util.UUID;

/**
 * Entity representing a self-service change request from an employee to modify their own information.
 * Requires approval before the change is applied.
 */
@Entity
@Table(name = "employee_change_request", schema = "hr_core")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class EmployeeChangeRequest extends TenantAwareEntity {

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Column(name = "field_name", nullable = false, length = 50)
    private String fieldName;

    @Column(name = "old_value", length = 500)
    private String oldValue;

    @Column(name = "new_value", nullable = false, length = 500)
    private String newValue;

    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private String status = "PENDING"; // PENDING, APPROVED, REJECTED

    @Column(name = "approval_document_id")
    private UUID approvalDocumentId;

    @Column(name = "reason", length = 500)
    private String reason;

    /**
     * Approve this change request.
     */
    public void approve() {
        this.status = "APPROVED";
    }

    /**
     * Reject this change request.
     */
    public void reject() {
        this.status = "REJECTED";
    }
}
