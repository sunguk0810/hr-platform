package com.hrsaas.appointment.domain.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateAppointmentDraftRequest {

    @NotBlank(message = "제목은 필수입니다")
    @Size(max = 200, message = "제목은 200자 이하여야 합니다")
    private String title;

    @NotNull(message = "시행일은 필수입니다")
    private LocalDate effectiveDate;

    @Size(max = 2000, message = "설명은 2000자 이하여야 합니다")
    private String description;

    @NotEmpty(message = "발령 상세 정보가 필요합니다")
    @Valid
    private List<CreateAppointmentDetailRequest> details;
}
