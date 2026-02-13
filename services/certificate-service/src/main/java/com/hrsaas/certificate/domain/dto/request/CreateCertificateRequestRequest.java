package com.hrsaas.certificate.domain.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

/**
 * 증명서 신청 요청 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateCertificateRequestRequest {

    @NotNull(message = "증명서 유형 ID는 필수입니다")
    private UUID certificateTypeId;

    @Size(max = 200, message = "발급목적은 200자 이내여야 합니다")
    private String purpose;

    @Size(max = 200, message = "제출처는 200자 이내여야 합니다")
    private String submissionTarget;

    @Min(value = 1, message = "발급부수는 1부 이상이어야 합니다")
    @Max(value = 10, message = "발급부수는 10부 이하여야 합니다")
    private Integer copies = 1;

    @Size(max = 10, message = "언어코드는 10자 이내여야 합니다")
    private String language = "KO";

    private boolean includeSalary = false;

    private LocalDate periodFrom;

    private LocalDate periodTo;

    private Map<String, Object> customFields;

    private String remarks;
}
