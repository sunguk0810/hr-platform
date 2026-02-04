package com.hrsaas.recruitment.domain.dto.request;

import com.hrsaas.recruitment.domain.entity.InterviewType;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * 면접 생성 요청 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateInterviewRequest {

    @NotNull(message = "지원서 ID는 필수입니다")
    private UUID applicationId;

    @NotNull(message = "면접 유형은 필수입니다")
    private InterviewType interviewType;

    private Integer round = 1;

    private LocalDate scheduledDate;

    private LocalTime scheduledTime;

    private Integer durationMinutes = 60;

    private String location;

    private String meetingUrl;

    private List<Map<String, Object>> interviewers;

    private String notes;

    private LocalDate feedbackDeadline;
}
