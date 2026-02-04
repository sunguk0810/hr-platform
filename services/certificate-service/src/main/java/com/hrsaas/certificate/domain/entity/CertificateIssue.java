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
 * 발급된 증명서 Entity
 */
@Entity
@Table(name = "certificate_issue", schema = "hr_certificate")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CertificateIssue extends TenantAwareEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_id", nullable = false)
    private CertificateRequest request;

    @Column(name = "issue_number", nullable = false, length = 50)
    private String issueNumber;

    @Column(name = "verification_code", nullable = false, length = 20)
    private String verificationCode;

    @Column(name = "file_id")
    private UUID fileId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "content_snapshot", columnDefinition = "jsonb")
    private Map<String, Object> contentSnapshot;

    @Column(name = "issued_by", nullable = false)
    private UUID issuedBy;

    @Column(name = "issued_at", nullable = false)
    private Instant issuedAt;

    @Column(name = "downloaded_at")
    private Instant downloadedAt;

    @Column(name = "download_count")
    private Integer downloadCount = 0;

    @Column(name = "verified_count")
    private Integer verifiedCount = 0;

    @Column(name = "last_verified_at")
    private Instant lastVerifiedAt;

    @Column(name = "expires_at", nullable = false)
    private LocalDate expiresAt;

    @Column(name = "is_revoked")
    private boolean revoked = false;

    @Column(name = "revoked_at")
    private Instant revokedAt;

    @Column(name = "revoked_by")
    private UUID revokedBy;

    @Column(name = "revoke_reason", columnDefinition = "TEXT")
    private String revokeReason;

    @Builder
    public CertificateIssue(CertificateRequest request, String issueNumber,
                            String verificationCode, UUID fileId,
                            Map<String, Object> contentSnapshot,
                            UUID issuedBy, LocalDate expiresAt) {
        this.request = request;
        this.issueNumber = issueNumber;
        this.verificationCode = verificationCode;
        this.fileId = fileId;
        this.contentSnapshot = contentSnapshot;
        this.issuedBy = issuedBy;
        this.issuedAt = Instant.now();
        this.expiresAt = expiresAt;
        this.downloadCount = 0;
        this.verifiedCount = 0;
        this.revoked = false;
    }

    public void markDownloaded() {
        this.downloadedAt = Instant.now();
        this.downloadCount++;
    }

    public void markVerified() {
        this.lastVerifiedAt = Instant.now();
        this.verifiedCount++;
    }

    public void revoke(UUID revokedBy, String reason) {
        this.revoked = true;
        this.revokedBy = revokedBy;
        this.revokedAt = Instant.now();
        this.revokeReason = reason;
    }

    public boolean isValid() {
        return !revoked && !expiresAt.isBefore(LocalDate.now());
    }

    public boolean isExpired() {
        return expiresAt.isBefore(LocalDate.now());
    }
}
