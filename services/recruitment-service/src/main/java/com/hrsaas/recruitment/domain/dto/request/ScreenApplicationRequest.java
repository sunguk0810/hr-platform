package com.hrsaas.recruitment.domain.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * 서류심사 요청 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScreenApplicationRequest {

    @NotNull(message = "심사자 ID는 필수입니다")
    private UUID screenedBy;

    @Min(value = 0, message = "점수는 0 이상이어야 합니다")
    @Max(value = 100, message = "점수는 100 이하이어야 합니다")
    private Integer score;

    private String notes;

    @NotNull(message = "통과 여부는 필수입니다")
    private Boolean passed;
}
