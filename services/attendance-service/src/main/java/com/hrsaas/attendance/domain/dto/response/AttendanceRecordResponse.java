package com.hrsaas.attendance.domain.dto.response;

import com.hrsaas.attendance.domain.entity.AttendanceRecord;
import com.hrsaas.attendance.domain.entity.AttendanceStatus;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

public record AttendanceRecordResponse(
    UUID id,
    UUID employeeId,
    LocalDate workDate,
    LocalTime checkInTime,
    LocalTime checkOutTime,
    AttendanceStatus status,
    Integer lateMinutes,
    Integer earlyLeaveMinutes,
    Integer overtimeMinutes,
    Integer workHours,
    String checkInLocation,
    String checkOutLocation,
    String note
) {
    public static AttendanceRecordResponse from(AttendanceRecord record) {
        return new AttendanceRecordResponse(
            record.getId(),
            record.getEmployeeId(),
            record.getWorkDate(),
            record.getCheckInTime(),
            record.getCheckOutTime(),
            record.getStatus(),
            record.getLateMinutes(),
            record.getEarlyLeaveMinutes(),
            record.getOvertimeMinutes(),
            record.getWorkHours(),
            record.getCheckInLocation(),
            record.getCheckOutLocation(),
            record.getNote()
        );
    }
}
