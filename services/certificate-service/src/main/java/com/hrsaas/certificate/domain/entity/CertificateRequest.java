package com.hrsaas.certificate.domain.entity;

import com.hrsaas.common.entity.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

/**
 * 증명서 신청 Entity
 */
@Entity
@Table(name = "certificate_request", schema = "hr_certificate")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CertificateRequest extends TenantAwareEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "certificate_type_id", nullable = false)
    private CertificateType certificateType;

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Column(name = "employee_name", length = 100)
    private String employeeName;

    @Column(name = "employee_number", length = 50)
    private String employeeNumber;

    @Column(name = "request_number", nullable = false, length = 50)
    private String requestNumber;

    @Column(name = "purpose", length = 200)
    private String purpose;

    @Column(name = "submission_target", length = 200)
    private String submissionTarget;

    @Column(name = "copies")
    private Integer copies = 1;

    @Column(name = "language", length = 10)
    private String language = "KO";

    @Column(name = "include_salary")
    private boolean includeSalary = false;

    @Column(name = "period_from")
    private LocalDate periodFrom;

    @Column(name = "period_to")
    private LocalDate periodTo;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "custom_fields", columnDefinition = "jsonb")
    private Map<String, Object> customFields;

    @Column(name = "remarks", columnDefinition = "TEXT")
    private String remarks;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private RequestStatus status = RequestStatus.PENDING;

    @Column(name = "approval_id")
    private UUID approvalId;

    @Column(name = "approved_by")
    private UUID approvedBy;

    @Column(name = "approved_at")
    private Instant approvedAt;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "issued_at")
    private Instant issuedAt;

    @Column(name = "issued_by")
    private UUID issuedBy;

    @Builder
    public CertificateRequest(CertificateType certificateType, UUID employeeId,
                              String employeeName, String employeeNumber,
                              String requestNumber, String purpose,
                              String submissionTarget, Integer copies,
                              String language, boolean includeSalary,
                              LocalDate periodFrom, LocalDate periodTo,
                              Map<String, Object> customFields, String remarks) {
        this.certificateType = certificateType;
        this.employeeId = employeeId;
        this.employeeName = employeeName;
        this.employeeNumber = employeeNumber;
        this.requestNumber = requestNumber;
        this.purpose = purpose;
        this.submissionTarget = submissionTarget;
        this.copies = copies != null ? copies : 1;
        this.language = language != null ? language : "KO";
        this.includeSalary = includeSalary;
        this.periodFrom = periodFrom;
        this.periodTo = periodTo;
        this.customFields = customFields;
        this.remarks = remarks;
        this.status = RequestStatus.PENDING;
    }

    public void approve(UUID approvedBy) {
        this.approvedBy = approvedBy;
        this.approvedAt = Instant.now();
        this.status = RequestStatus.APPROVED;
    }

    public void reject(String reason) {
        this.rejectionReason = reason;
        this.status = RequestStatus.REJECTED;
    }

    public void issue(UUID issuedBy) {
        this.issuedBy = issuedBy;
        this.issuedAt = Instant.now();
        this.status = RequestStatus.ISSUED;
    }

    public void cancel() {
        this.status = RequestStatus.CANCELLED;
    }
}
