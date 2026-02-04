package com.hrsaas.certificate.domain.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

/**
 * 증명서 발급 요청 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IssueCertificateRequest {

    @NotNull(message = "발급자 ID는 필수입니다")
    private UUID issuedBy;

    private LocalDate expiresAt;

    private String comment;
}
