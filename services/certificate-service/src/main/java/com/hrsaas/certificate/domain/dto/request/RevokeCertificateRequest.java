package com.hrsaas.certificate.domain.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * 증명서 취소 요청 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RevokeCertificateRequest {

    @NotNull(message = "취소자 ID는 필수입니다")
    private UUID revokedBy;

    @NotBlank(message = "취소 사유는 필수입니다")
    private String reason;
}
