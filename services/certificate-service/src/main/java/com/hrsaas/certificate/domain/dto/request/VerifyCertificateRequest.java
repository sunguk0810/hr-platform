package com.hrsaas.certificate.domain.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 증명서 진위확인 요청 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VerifyCertificateRequest {

    @NotBlank(message = "진위확인 코드는 필수입니다")
    @Size(max = 20, message = "진위확인 코드는 20자 이내여야 합니다")
    private String verificationCode;

    @Size(max = 100, message = "확인자명은 100자 이내여야 합니다")
    private String verifierName;

    @Size(max = 200, message = "확인기관은 200자 이내여야 합니다")
    private String verifierOrganization;
}
