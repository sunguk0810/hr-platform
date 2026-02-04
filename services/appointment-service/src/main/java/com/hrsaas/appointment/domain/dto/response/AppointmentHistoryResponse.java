package com.hrsaas.appointment.domain.dto.response;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.hrsaas.appointment.domain.entity.AppointmentHistory;
import com.hrsaas.appointment.domain.entity.AppointmentType;
import com.hrsaas.common.privacy.Masked;
import com.hrsaas.common.privacy.MaskType;
import com.hrsaas.common.privacy.serializer.MaskedFieldSerializer;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentHistoryResponse {

    private UUID id;
    private UUID employeeId;

    @Masked(type = MaskType.NAME)
    @JsonSerialize(using = MaskedFieldSerializer.class)
    private String employeeName;

    private String employeeNumber;
    private AppointmentType appointmentType;
    private String appointmentTypeName;
    private LocalDate effectiveDate;
    private Map<String, Object> fromValues;
    private Map<String, Object> toValues;
    private String reason;
    private String draftNumber;
    private Instant createdAt;

    public static AppointmentHistoryResponse from(AppointmentHistory history) {
        return AppointmentHistoryResponse.builder()
            .id(history.getId())
            .employeeId(history.getEmployeeId())
            .employeeName(history.getEmployeeName())
            .employeeNumber(history.getEmployeeNumber())
            .appointmentType(history.getAppointmentType())
            .appointmentTypeName(getAppointmentTypeName(history.getAppointmentType()))
            .effectiveDate(history.getEffectiveDate())
            .fromValues(history.getFromValues())
            .toValues(history.getToValues())
            .reason(history.getReason())
            .draftNumber(history.getDraftNumber())
            .createdAt(history.getCreatedAt())
            .build();
    }

    private static String getAppointmentTypeName(AppointmentType type) {
        if (type == null) return null;
        return switch (type) {
            case PROMOTION -> "승진";
            case TRANSFER -> "전보";
            case POSITION_CHANGE -> "보직변경";
            case JOB_CHANGE -> "직무변경";
            case LEAVE_OF_ABSENCE -> "휴직";
            case REINSTATEMENT -> "복직";
            case RESIGNATION -> "사직";
            case RETIREMENT -> "정년퇴직";
            case DEMOTION -> "강등";
            case CONCURRENT -> "겸직";
        };
    }
}
