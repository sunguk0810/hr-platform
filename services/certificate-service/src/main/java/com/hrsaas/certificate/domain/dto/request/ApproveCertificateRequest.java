package com.hrsaas.certificate.domain.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * 증명서 신청 승인 요청 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApproveCertificateRequest {

    @NotNull(message = "승인자 ID는 필수입니다")
    private UUID approvedBy;

    private String comment;
}
