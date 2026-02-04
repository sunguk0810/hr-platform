package com.hrsaas.appointment.domain.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CancelAppointmentRequest {

    @NotBlank(message = "취소 사유는 필수입니다")
    @Size(max = 1000, message = "취소 사유는 1000자 이하여야 합니다")
    private String reason;
}
