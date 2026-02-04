package com.hrsaas.attendance.domain.dto.response;

public record AttendanceSummaryResponse(
    int year,
    int month,
    int totalWorkDays,
    int presentDays,
    int lateDays,
    int earlyLeaveDays,
    int totalOvertimeMinutes,
    int totalWorkHours
) {
    public static AttendanceSummaryResponse of(int year, int month, int totalWorkDays, int presentDays,
                                                int lateDays, int earlyLeaveDays,
                                                int totalOvertimeMinutes, int totalWorkHours) {
        return new AttendanceSummaryResponse(
            year, month, totalWorkDays, presentDays,
            lateDays, earlyLeaveDays, totalOvertimeMinutes, totalWorkHours
        );
    }
}
