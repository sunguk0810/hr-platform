package com.hrsaas.attendance.domain.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * 부서별 근태 현황 요약 응답 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DepartmentAttendanceSummaryResponse {
    private UUID departmentId;
    private String departmentName;
    private int totalEmployees;
    private int presentCount;
    private int lateCount;
    private int absentCount;
    private int onLeaveCount;
    private double attendanceRate;
}
