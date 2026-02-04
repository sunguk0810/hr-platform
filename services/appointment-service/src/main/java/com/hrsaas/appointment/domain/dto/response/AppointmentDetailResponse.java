package com.hrsaas.appointment.domain.dto.response;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.hrsaas.appointment.domain.entity.AppointmentDetail;
import com.hrsaas.appointment.domain.entity.AppointmentType;
import com.hrsaas.appointment.domain.entity.DetailStatus;
import com.hrsaas.common.privacy.Masked;
import com.hrsaas.common.privacy.MaskType;
import com.hrsaas.common.privacy.serializer.MaskedFieldSerializer;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentDetailResponse {

    private UUID id;
    private UUID employeeId;

    @Masked(type = MaskType.NAME)
    @JsonSerialize(using = MaskedFieldSerializer.class)
    private String employeeName;

    private String employeeNumber;
    private AppointmentType appointmentType;
    private String appointmentTypeName;

    private UUID fromDepartmentId;
    private String fromDepartmentName;
    private UUID toDepartmentId;
    private String toDepartmentName;

    private String fromPositionCode;
    private String fromPositionName;
    private String toPositionCode;
    private String toPositionName;

    private String fromGradeCode;
    private String fromGradeName;
    private String toGradeCode;
    private String toGradeName;

    private String fromJobCode;
    private String fromJobName;
    private String toJobCode;
    private String toJobName;

    private String reason;
    private DetailStatus status;
    private Instant executedAt;
    private String errorMessage;
    private Instant createdAt;

    public static AppointmentDetailResponse from(AppointmentDetail detail) {
        return AppointmentDetailResponse.builder()
            .id(detail.getId())
            .employeeId(detail.getEmployeeId())
            .employeeName(detail.getEmployeeName())
            .employeeNumber(detail.getEmployeeNumber())
            .appointmentType(detail.getAppointmentType())
            .appointmentTypeName(getAppointmentTypeName(detail.getAppointmentType()))
            .fromDepartmentId(detail.getFromDepartmentId())
            .fromDepartmentName(detail.getFromDepartmentName())
            .toDepartmentId(detail.getToDepartmentId())
            .toDepartmentName(detail.getToDepartmentName())
            .fromPositionCode(detail.getFromPositionCode())
            .fromPositionName(detail.getFromPositionName())
            .toPositionCode(detail.getToPositionCode())
            .toPositionName(detail.getToPositionName())
            .fromGradeCode(detail.getFromGradeCode())
            .fromGradeName(detail.getFromGradeName())
            .toGradeCode(detail.getToGradeCode())
            .toGradeName(detail.getToGradeName())
            .fromJobCode(detail.getFromJobCode())
            .fromJobName(detail.getFromJobName())
            .toJobCode(detail.getToJobCode())
            .toJobName(detail.getToJobName())
            .reason(detail.getReason())
            .status(detail.getStatus())
            .executedAt(detail.getExecutedAt())
            .errorMessage(detail.getErrorMessage())
            .createdAt(detail.getCreatedAt())
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
