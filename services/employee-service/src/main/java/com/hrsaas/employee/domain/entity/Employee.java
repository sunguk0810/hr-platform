package com.hrsaas.employee.domain.entity;

import com.hrsaas.common.entity.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "employee", schema = "hr_core")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Employee extends TenantAwareEntity {

    @Column(name = "employee_number", nullable = false, length = 50)
    private String employeeNumber;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "name_en", length = 100)
    private String nameEn;

    @Column(name = "email", nullable = false, length = 200)
    private String email;

    @Column(name = "phone", length = 20)
    private String phone;

    @Column(name = "mobile", length = 20)
    private String mobile;

    @Column(name = "department_id")
    private UUID departmentId;

    @Column(name = "position_code", length = 50)
    private String positionCode;

    @Column(name = "job_title_code", length = 50)
    private String jobTitleCode;

    @Column(name = "hire_date")
    private LocalDate hireDate;

    @Column(name = "resign_date")
    private LocalDate resignDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private EmployeeStatus status = EmployeeStatus.ACTIVE;

    @Enumerated(EnumType.STRING)
    @Column(name = "employment_type", length = 20)
    private EmploymentType employmentType = EmploymentType.REGULAR;

    @Column(name = "manager_id")
    private UUID managerId;

    @Column(name = "user_id")
    private UUID userId;

    @Builder
    public Employee(String employeeNumber, String name, String nameEn, String email,
                    String phone, String mobile, UUID departmentId, String positionCode,
                    String jobTitleCode, LocalDate hireDate, EmploymentType employmentType,
                    UUID managerId) {
        this.employeeNumber = employeeNumber;
        this.name = name;
        this.nameEn = nameEn;
        this.email = email;
        this.phone = phone;
        this.mobile = mobile;
        this.departmentId = departmentId;
        this.positionCode = positionCode;
        this.jobTitleCode = jobTitleCode;
        this.hireDate = hireDate;
        this.employmentType = employmentType != null ? employmentType : EmploymentType.REGULAR;
        this.managerId = managerId;
        this.status = EmployeeStatus.ACTIVE;
    }

    public void transfer(UUID newDepartmentId, String newPositionCode) {
        this.departmentId = newDepartmentId;
        this.positionCode = newPositionCode;
    }

    public void resign(LocalDate resignDate) {
        this.resignDate = resignDate;
        this.status = EmployeeStatus.RESIGNED;
    }

    public void activate() {
        this.status = EmployeeStatus.ACTIVE;
    }

    public void suspend() {
        this.status = EmployeeStatus.SUSPENDED;
    }

    public boolean isActive() {
        return this.status == EmployeeStatus.ACTIVE;
    }
}
