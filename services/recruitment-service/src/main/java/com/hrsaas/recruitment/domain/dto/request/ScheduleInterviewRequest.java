package com.hrsaas.recruitment.domain.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * 면접 일정 확정 요청 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScheduleInterviewRequest {

    @NotNull(message = "면접 날짜는 필수입니다")
    private LocalDate scheduledDate;

    @NotNull(message = "면접 시간은 필수입니다")
    private LocalTime scheduledTime;

    private String location;

    private String meetingUrl;
}
