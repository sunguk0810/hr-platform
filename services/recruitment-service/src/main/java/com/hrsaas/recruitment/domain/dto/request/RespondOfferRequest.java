package com.hrsaas.recruitment.domain.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 채용 제안 응답(수락/거절) 요청 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RespondOfferRequest {

    @NotBlank(message = "응답 유형은 필수입니다 (ACCEPT/DECLINE)")
    private String action;

    private String reason;
}
