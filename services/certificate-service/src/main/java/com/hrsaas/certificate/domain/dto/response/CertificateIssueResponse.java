package com.hrsaas.certificate.domain.dto.response;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.hrsaas.certificate.domain.entity.CertificateIssue;
import com.hrsaas.common.privacy.Masked;
import com.hrsaas.common.privacy.MaskType;
import com.hrsaas.common.privacy.serializer.MaskedFieldSerializer;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

/**
 * 발급된 증명서 응답 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CertificateIssueResponse {

    private UUID id;
    private UUID requestId;
    private String requestNumber;
    private String certificateTypeName;

    @Masked(type = MaskType.NAME)
    @JsonSerialize(using = MaskedFieldSerializer.class)
    private String employeeName;

    private String employeeNumber;
    private String issueNumber;
    private String verificationCode;
    private UUID fileId;
    private Map<String, Object> contentSnapshot;
    private UUID issuedBy;
    private Instant issuedAt;
    private Instant downloadedAt;
    private Integer downloadCount;
    private Integer verifiedCount;
    private Instant lastVerifiedAt;
    private LocalDate expiresAt;
    private boolean revoked;
    private Instant revokedAt;
    private UUID revokedBy;
    private String revokeReason;
    private boolean valid;
    private boolean expired;
    private Instant createdAt;

    public static CertificateIssueResponse from(CertificateIssue entity) {
        return CertificateIssueResponse.builder()
                .id(entity.getId())
                .requestId(entity.getRequest() != null ? entity.getRequest().getId() : null)
                .requestNumber(entity.getRequest() != null ? entity.getRequest().getRequestNumber() : null)
                .certificateTypeName(entity.getRequest() != null && entity.getRequest().getCertificateType() != null
                        ? entity.getRequest().getCertificateType().getName() : null)
                .employeeName(entity.getRequest() != null ? entity.getRequest().getEmployeeName() : null)
                .employeeNumber(entity.getRequest() != null ? entity.getRequest().getEmployeeNumber() : null)
                .issueNumber(entity.getIssueNumber())
                .verificationCode(entity.getVerificationCode())
                .fileId(entity.getFileId())
                .contentSnapshot(entity.getContentSnapshot())
                .issuedBy(entity.getIssuedBy())
                .issuedAt(entity.getIssuedAt())
                .downloadedAt(entity.getDownloadedAt())
                .downloadCount(entity.getDownloadCount())
                .verifiedCount(entity.getVerifiedCount())
                .lastVerifiedAt(entity.getLastVerifiedAt())
                .expiresAt(entity.getExpiresAt())
                .revoked(entity.isRevoked())
                .revokedAt(entity.getRevokedAt())
                .revokedBy(entity.getRevokedBy())
                .revokeReason(entity.getRevokeReason())
                .valid(entity.isValid())
                .expired(entity.isExpired())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
