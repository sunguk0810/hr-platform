package com.hrsaas.employee.domain.dto.response;

import com.hrsaas.employee.domain.entity.EmployeeCertificate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeCertificateResponse {

    private UUID id;
    private UUID employeeId;
    private String certificateName;
    private String issuingOrganization;
    private String certificateNumber;
    private LocalDate issueDate;
    private LocalDate expiryDate;
    private String grade;
    private Boolean isVerified;
    private Boolean isExpired;
    private Instant createdAt;

    public static EmployeeCertificateResponse from(EmployeeCertificate certificate) {
        return EmployeeCertificateResponse.builder()
            .id(certificate.getId())
            .employeeId(certificate.getEmployeeId())
            .certificateName(certificate.getCertificateName())
            .issuingOrganization(certificate.getIssuingOrganization())
            .certificateNumber(certificate.getCertificateNumber())
            .issueDate(certificate.getIssueDate())
            .expiryDate(certificate.getExpiryDate())
            .grade(certificate.getGrade())
            .isVerified(certificate.getIsVerified())
            .isExpired(certificate.isExpired())
            .createdAt(certificate.getCreatedAt())
            .build();
    }
}
