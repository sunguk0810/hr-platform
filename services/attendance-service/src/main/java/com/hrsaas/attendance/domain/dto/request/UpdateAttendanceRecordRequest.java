package com.hrsaas.attendance.domain.dto.request;

import com.hrsaas.attendance.domain.entity.AttendanceStatus;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateAttendanceRecordRequest {

    private LocalTime checkInTime;

    private LocalTime checkOutTime;

    private AttendanceStatus status;

    @NotBlank(message = "수정 사유는 필수입니다")
    private String remarks;
}
