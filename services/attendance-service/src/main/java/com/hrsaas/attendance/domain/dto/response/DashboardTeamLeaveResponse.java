package com.hrsaas.attendance.domain.dto.response;

import com.hrsaas.attendance.domain.entity.LeaveType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardTeamLeaveResponse {

    private List<TeamLeaveItem> leaves;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TeamLeaveItem {
        private UUID id;
        private UUID employeeId;
        private String employeeName;
        private String departmentName;
        private LeaveType leaveType;
        private LocalDate startDate;
        private LocalDate endDate;

        public static TeamLeaveItem from(LeaveCalendarEventResponse event) {
            return TeamLeaveItem.builder()
                .id(event.getId())
                .employeeId(event.getEmployeeId())
                .employeeName(event.getEmployeeName())
                .departmentName(event.getDepartmentName())
                .leaveType(event.getLeaveType())
                .startDate(event.getStartDate())
                .endDate(event.getEndDate())
                .build();
        }
    }
}
