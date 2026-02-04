package com.hrsaas.recruitment.domain.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * 면접 평가 생성 요청 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateInterviewScoreRequest {

    @NotNull(message = "면접관 ID는 필수입니다")
    private UUID interviewerId;

    @Size(max = 100, message = "면접관명은 100자 이내여야 합니다")
    private String interviewerName;

    @NotBlank(message = "평가 기준은 필수입니다")
    @Size(max = 100, message = "평가 기준은 100자 이내여야 합니다")
    private String criterion;

    @NotNull(message = "점수는 필수입니다")
    @Min(value = 0, message = "점수는 0 이상이어야 합니다")
    private Integer score;

    @Min(value = 1, message = "최대 점수는 1 이상이어야 합니다")
    private Integer maxScore = 5;

    @DecimalMin(value = "0.0", message = "가중치는 0 이상이어야 합니다")
    @DecimalMax(value = "1.0", message = "가중치는 1 이하이어야 합니다")
    private Double weight = 1.0;

    private String comment;
}
