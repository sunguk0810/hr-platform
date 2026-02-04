package com.hrsaas.employee.domain.entity;

import com.hrsaas.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "employee_career", schema = "hr_core")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class EmployeeCareer extends BaseEntity {

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Column(name = "company_name", nullable = false, length = 200)
    private String companyName;

    @Column(name = "department", length = 100)
    private String department;

    @Column(name = "position", length = 100)
    private String position;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "job_description", length = 1000)
    private String jobDescription;

    @Column(name = "resignation_reason", length = 500)
    private String resignationReason;

    @Column(name = "is_verified")
    private Boolean isVerified = false;

    @Builder
    public EmployeeCareer(UUID employeeId, String companyName, String department,
                          String position, LocalDate startDate, LocalDate endDate,
                          String jobDescription, String resignationReason) {
        this.employeeId = employeeId;
        this.companyName = companyName;
        this.department = department;
        this.position = position;
        this.startDate = startDate;
        this.endDate = endDate;
        this.jobDescription = jobDescription;
        this.resignationReason = resignationReason;
        this.isVerified = false;
    }

    public void verify() {
        this.isVerified = true;
    }
}
