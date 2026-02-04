package com.hrsaas.recruitment.domain.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * 지원서 생성 요청 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateApplicationRequest {

    @NotNull(message = "채용공고 ID는 필수입니다")
    private UUID jobPostingId;

    @NotNull(message = "지원자 ID는 필수입니다")
    private UUID applicantId;

    private String coverLetter;

    private List<Map<String, Object>> answers;

    private Long expectedSalary;

    private String availableDate;

    private String referrerName;

    private UUID referrerEmployeeId;
}
