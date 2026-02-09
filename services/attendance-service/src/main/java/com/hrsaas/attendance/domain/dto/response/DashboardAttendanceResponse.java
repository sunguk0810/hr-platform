package com.hrsaas.attendance.domain.dto.response;

import com.hrsaas.attendance.domain.entity.AttendanceStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardAttendanceResponse {

    private AttendanceStatus status;
    private LocalTime checkInTime;
    private LocalTime checkOutTime;
    private Integer workDuration;
    private Integer scheduledWorkHours;
    private Integer overtimeHours;

    public static DashboardAttendanceResponse from(AttendanceRecordResponse record) {
        return DashboardAttendanceResponse.builder()
            .status(record.status())
            .checkInTime(record.checkInTime())
            .checkOutTime(record.checkOutTime())
            .workDuration(record.workHours())
            .scheduledWorkHours(8)
            .overtimeHours(record.overtimeMinutes() != null ? record.overtimeMinutes() / 60 : 0)
            .build();
    }

    public static DashboardAttendanceResponse empty() {
        return DashboardAttendanceResponse.builder()
            .status(null)
            .scheduledWorkHours(8)
            .overtimeHours(0)
            .build();
    }
}
