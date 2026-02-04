package com.hrsaas.certificate.domain.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;

/**
 * 진위확인 결과 응답 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VerificationResultResponse {

    private boolean valid;
    private String failureReason;
    private String certificateTypeName;
    private String employeeName;
    private String issueNumber;
    private Instant issuedAt;
    private LocalDate expiresAt;
    private String issuingOrganization;
    private boolean expired;
    private boolean revoked;
    private Instant verifiedAt;

    public static VerificationResultResponse success(
            String certificateTypeName,
            String employeeName,
            String issueNumber,
            Instant issuedAt,
            LocalDate expiresAt,
            String issuingOrganization) {
        return VerificationResultResponse.builder()
                .valid(true)
                .certificateTypeName(certificateTypeName)
                .employeeName(employeeName)
                .issueNumber(issueNumber)
                .issuedAt(issuedAt)
                .expiresAt(expiresAt)
                .issuingOrganization(issuingOrganization)
                .expired(false)
                .revoked(false)
                .verifiedAt(Instant.now())
                .build();
    }

    public static VerificationResultResponse expired(
            String certificateTypeName,
            String employeeName,
            String issueNumber,
            Instant issuedAt,
            LocalDate expiresAt) {
        return VerificationResultResponse.builder()
                .valid(false)
                .failureReason("만료된 증명서입니다")
                .certificateTypeName(certificateTypeName)
                .employeeName(employeeName)
                .issueNumber(issueNumber)
                .issuedAt(issuedAt)
                .expiresAt(expiresAt)
                .expired(true)
                .revoked(false)
                .verifiedAt(Instant.now())
                .build();
    }

    public static VerificationResultResponse revoked(
            String certificateTypeName,
            String employeeName,
            String issueNumber,
            Instant issuedAt,
            LocalDate expiresAt,
            String revokeReason) {
        return VerificationResultResponse.builder()
                .valid(false)
                .failureReason("취소된 증명서입니다: " + revokeReason)
                .certificateTypeName(certificateTypeName)
                .employeeName(employeeName)
                .issueNumber(issueNumber)
                .issuedAt(issuedAt)
                .expiresAt(expiresAt)
                .expired(false)
                .revoked(true)
                .verifiedAt(Instant.now())
                .build();
    }

    public static VerificationResultResponse notFound() {
        return VerificationResultResponse.builder()
                .valid(false)
                .failureReason("해당 진위확인 코드에 해당하는 증명서가 없습니다")
                .verifiedAt(Instant.now())
                .build();
    }
}
