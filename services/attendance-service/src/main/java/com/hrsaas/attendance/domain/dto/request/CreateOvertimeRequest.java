package com.hrsaas.attendance.domain.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateOvertimeRequest {

    @NotNull(message = "초과근무 날짜는 필수입니다")
    private LocalDate overtimeDate;

    @NotNull(message = "시작 시간은 필수입니다")
    private LocalTime startTime;

    @NotNull(message = "종료 시간은 필수입니다")
    private LocalTime endTime;

    @NotNull(message = "예상 근무 시간은 필수입니다")
    private BigDecimal plannedHours;

    @NotBlank(message = "사유는 필수입니다")
    @Size(max = 500)
    private String reason;
}
