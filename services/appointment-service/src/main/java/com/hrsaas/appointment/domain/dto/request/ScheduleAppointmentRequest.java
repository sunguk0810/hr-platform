package com.hrsaas.appointment.domain.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScheduleAppointmentRequest {

    @NotNull(message = "예약일은 필수입니다")
    private LocalDate scheduledDate;

    private LocalTime scheduledTime;
}
