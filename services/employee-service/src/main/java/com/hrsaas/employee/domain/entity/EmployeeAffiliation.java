package com.hrsaas.employee.domain.entity;

import com.hrsaas.common.entity.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Employee affiliation entity representing primary, secondary, or concurrent department assignments.
 */
@Entity
@Table(name = "employee_affiliation", schema = "hr_core")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class EmployeeAffiliation extends TenantAwareEntity {

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Column(name = "department_id", nullable = false)
    private UUID departmentId;

    @Column(name = "department_name", length = 200)
    private String departmentName;

    @Column(name = "position_code", length = 50)
    private String positionCode;

    @Column(name = "position_name", length = 200)
    private String positionName;

    @Column(name = "is_primary", nullable = false)
    @Builder.Default
    private Boolean isPrimary = false;

    @Column(name = "affiliation_type", nullable = false, length = 20)
    @Builder.Default
    private String affiliationType = "PRIMARY"; // PRIMARY, SECONDARY, CONCURRENT

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    /**
     * Deactivate this affiliation by setting isActive to false and recording the end date.
     */
    public void deactivate() {
        this.isActive = false;
        this.endDate = LocalDate.now();
    }

    /**
     * Activate this affiliation by setting isActive to true and clearing the end date.
     */
    public void activate() {
        this.isActive = true;
        this.endDate = null;
    }
}
