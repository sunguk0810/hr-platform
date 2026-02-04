package com.hrsaas.certificate.domain.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 증명서 신청 반려 요청 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RejectCertificateRequest {

    @NotBlank(message = "반려 사유는 필수입니다")
    private String reason;
}
