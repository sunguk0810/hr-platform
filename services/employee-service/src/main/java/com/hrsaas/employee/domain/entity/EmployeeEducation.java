package com.hrsaas.employee.domain.entity;

import com.hrsaas.common.entity.AuditableEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "employee_education", schema = "hr_core")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class EmployeeEducation extends AuditableEntity {

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Column(name = "school_type", nullable = false, length = 30)
    private String schoolType; // HIGH_SCHOOL, COLLEGE, UNIVERSITY, GRADUATE, DOCTORATE

    @Column(name = "school_name", nullable = false, length = 200)
    private String schoolName;

    @Column(name = "major", length = 100)
    private String major;

    @Column(name = "degree", length = 50)
    private String degree;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "graduation_status", length = 20)
    private String graduationStatus; // ENROLLED, GRADUATED, DROPPED_OUT, ON_LEAVE

    @Column(name = "is_verified")
    private Boolean isVerified = false;

    @Builder
    public EmployeeEducation(UUID employeeId, String schoolType, String schoolName,
                             String major, String degree, LocalDate startDate,
                             LocalDate endDate, String graduationStatus) {
        this.employeeId = employeeId;
        this.schoolType = schoolType;
        this.schoolName = schoolName;
        this.major = major;
        this.degree = degree;
        this.startDate = startDate;
        this.endDate = endDate;
        this.graduationStatus = graduationStatus;
        this.isVerified = false;
    }

    public void verify() {
        this.isVerified = true;
    }
}
