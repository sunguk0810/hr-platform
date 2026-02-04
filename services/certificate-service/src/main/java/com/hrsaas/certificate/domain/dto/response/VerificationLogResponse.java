package com.hrsaas.certificate.domain.dto.response;

import com.hrsaas.certificate.domain.entity.VerificationLog;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

/**
 * 진위확인 로그 응답 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VerificationLogResponse {

    private UUID id;
    private UUID issueId;
    private String issueNumber;
    private String verificationCode;
    private Instant verifiedAt;
    private String verifierIp;
    private String verifierUserAgent;
    private String verifierName;
    private String verifierOrganization;
    private boolean valid;
    private String failureReason;

    public static VerificationLogResponse from(VerificationLog entity) {
        return VerificationLogResponse.builder()
                .id(entity.getId())
                .issueId(entity.getIssue() != null ? entity.getIssue().getId() : null)
                .issueNumber(entity.getIssue() != null ? entity.getIssue().getIssueNumber() : null)
                .verificationCode(entity.getVerificationCode())
                .verifiedAt(entity.getVerifiedAt())
                .verifierIp(entity.getVerifierIp())
                .verifierUserAgent(entity.getVerifierUserAgent())
                .verifierName(entity.getVerifierName())
                .verifierOrganization(entity.getVerifierOrganization())
                .valid(entity.isValid())
                .failureReason(entity.getFailureReason())
                .build();
    }
}
