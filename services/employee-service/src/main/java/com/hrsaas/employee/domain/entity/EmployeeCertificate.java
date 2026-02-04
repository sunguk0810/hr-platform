package com.hrsaas.employee.domain.entity;

import com.hrsaas.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "employee_certificate", schema = "hr_core")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class EmployeeCertificate extends BaseEntity {

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Column(name = "certificate_name", nullable = false, length = 200)
    private String certificateName;

    @Column(name = "issuing_organization", length = 200)
    private String issuingOrganization;

    @Column(name = "certificate_number", length = 100)
    private String certificateNumber;

    @Column(name = "issue_date")
    private LocalDate issueDate;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @Column(name = "grade", length = 50)
    private String grade;

    @Column(name = "is_verified")
    private Boolean isVerified = false;

    @Builder
    public EmployeeCertificate(UUID employeeId, String certificateName,
                               String issuingOrganization, String certificateNumber,
                               LocalDate issueDate, LocalDate expiryDate, String grade) {
        this.employeeId = employeeId;
        this.certificateName = certificateName;
        this.issuingOrganization = issuingOrganization;
        this.certificateNumber = certificateNumber;
        this.issueDate = issueDate;
        this.expiryDate = expiryDate;
        this.grade = grade;
        this.isVerified = false;
    }

    public void verify() {
        this.isVerified = true;
    }

    public boolean isExpired() {
        return expiryDate != null && expiryDate.isBefore(LocalDate.now());
    }
}
