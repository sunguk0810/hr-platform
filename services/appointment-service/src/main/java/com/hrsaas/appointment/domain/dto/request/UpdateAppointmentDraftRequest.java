package com.hrsaas.appointment.domain.dto.request;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateAppointmentDraftRequest {

    @Size(max = 200, message = "제목은 200자 이하여야 합니다")
    private String title;

    private LocalDate effectiveDate;

    @Size(max = 2000, message = "설명은 2000자 이하여야 합니다")
    private String description;
}
