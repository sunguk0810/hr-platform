package com.hrsaas.attendance.domain.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

/**
 * 주간 근로시간 통계 응답 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkHoursStatisticsResponse {

    private String period;
    private LocalDate weekStartDate;
    private LocalDate weekEndDate;
    private List<EmployeeWorkHoursResponse> employees;
    private WorkHoursSummaryResponse summary;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EmployeeWorkHoursResponse {
        private String employeeId;
        private String employeeName;
        private String department;
        private String departmentId;
        private double regularHours;
        private double overtimeHours;
        private double totalHours;
        private String status;  // NORMAL, WARNING, EXCEEDED
        private double exceededHours;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WorkHoursSummaryResponse {
        private int totalEmployees;
        private int normalCount;
        private int warningCount;
        private int exceededCount;
    }

    /**
     * 근무시간 상태 유형
     */
    public enum WorkHourStatus {
        NORMAL,      // 48시간 미만
        WARNING,     // 48-52시간
        EXCEEDED     // 52시간 초과
    }

    /**
     * 총 근무시간 기준으로 상태 결정
     */
    public static String determineStatus(double totalHours) {
        if (totalHours >= 52) {
            return WorkHourStatus.EXCEEDED.name();
        } else if (totalHours >= 48) {
            return WorkHourStatus.WARNING.name();
        } else {
            return WorkHourStatus.NORMAL.name();
        }
    }
}
