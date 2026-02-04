package com.hrsaas.appointment.domain.dto.request;

import com.hrsaas.appointment.domain.entity.AppointmentType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateAppointmentDetailRequest {

    @NotNull(message = "직원 ID는 필수입니다")
    private UUID employeeId;

    @NotNull(message = "발령 유형은 필수입니다")
    private AppointmentType appointmentType;

    private UUID toDepartmentId;

    private String toPositionCode;

    private String toGradeCode;

    private String toJobCode;

    @Size(max = 1000, message = "사유는 1000자 이하여야 합니다")
    private String reason;
}
