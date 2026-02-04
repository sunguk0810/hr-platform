package com.hrsaas.certificate.domain.entity;

import com.hrsaas.common.entity.AuditableEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * 진위확인 로그 Entity
 */
@Entity
@Table(name = "verification_log", schema = "hr_certificate")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class VerificationLog extends AuditableEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "issue_id")
    private CertificateIssue issue;

    @Column(name = "verification_code", nullable = false, length = 20)
    private String verificationCode;

    @Column(name = "verified_at", nullable = false)
    private Instant verifiedAt;

    @Column(name = "verifier_ip", length = 45)
    private String verifierIp;

    @Column(name = "verifier_user_agent", columnDefinition = "TEXT")
    private String verifierUserAgent;

    @Column(name = "verifier_name", length = 100)
    private String verifierName;

    @Column(name = "verifier_organization", length = 200)
    private String verifierOrganization;

    @Column(name = "is_valid", nullable = false)
    private boolean valid;

    @Column(name = "failure_reason", length = 100)
    private String failureReason;

    @Builder
    public VerificationLog(CertificateIssue issue, String verificationCode,
                           String verifierIp, String verifierUserAgent,
                           String verifierName, String verifierOrganization,
                           boolean valid, String failureReason) {
        this.issue = issue;
        this.verificationCode = verificationCode;
        this.verifiedAt = Instant.now();
        this.verifierIp = verifierIp;
        this.verifierUserAgent = verifierUserAgent;
        this.verifierName = verifierName;
        this.verifierOrganization = verifierOrganization;
        this.valid = valid;
        this.failureReason = failureReason;
    }
}
