package com.hrsaas.attendance.controller;

import com.hrsaas.attendance.domain.dto.response.*;
import com.hrsaas.attendance.service.AttendanceService;
import com.hrsaas.attendance.service.LeaveService;
import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.common.response.PageResponse;
import com.hrsaas.common.security.SecurityContextHolder;
import com.hrsaas.common.security.UserContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.Year;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard-Attendance", description = "대시보드 근태/휴가 API")
public class DashboardController {

    private final AttendanceService attendanceService;
    private final LeaveService leaveService;

    @GetMapping("/attendance")
    @Operation(summary = "오늘 내 출퇴근 현황")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<DashboardAttendanceResponse> getAttendance() {
        UUID employeeId = SecurityContextHolder.getCurrentEmployeeId();
        try {
            AttendanceRecordResponse record = attendanceService.getToday(employeeId);
            return ApiResponse.success(DashboardAttendanceResponse.from(record));
        } catch (Exception e) {
            return ApiResponse.success(DashboardAttendanceResponse.empty());
        }
    }

    @GetMapping("/leave-balance")
    @Operation(summary = "내 휴가 잔여일수")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Map<String, Object>> getLeaveBalance() {
        UUID employeeId = SecurityContextHolder.getCurrentEmployeeId();
        int year = Year.now().getValue();

        List<LeaveBalanceResponse> balances = leaveService.getMyBalances(employeeId, year);
        Map<String, Map<String, Object>> balanceMap = balances.stream()
            .collect(Collectors.toMap(
                b -> b.getLeaveType().name().toLowerCase(),
                b -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("total", b.getTotalDays());
                    item.put("used", b.getUsedDays());
                    item.put("remaining", b.getAvailableDays());
                    return item;
                },
                (a, b) -> a
            ));

        PageResponse<LeaveRequestResponse> myLeaves = leaveService.getMyLeaves(employeeId, PageRequest.of(0, 5));
        List<LeaveRequestResponse> upcoming = myLeaves.getContent().stream()
            .filter(l -> l.getStartDate() != null && !l.getStartDate().isBefore(LocalDate.now()))
            .toList();

        Map<String, Object> result = new LinkedHashMap<>(balanceMap);
        result.put("upcoming", upcoming);
        return ApiResponse.success(result);
    }

    @GetMapping("/team-leave")
    @Operation(summary = "팀 휴가 현황")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<DashboardTeamLeaveResponse> getTeamLeave() {
        UserContext user = SecurityContextHolder.getCurrentUser();
        UUID departmentId = user.getDepartmentId();
        LocalDate today = LocalDate.now();
        LocalDate endDate = today.plusDays(3);

        List<LeaveCalendarEventResponse> events = leaveService.getCalendarEvents(today, endDate, departmentId);
        List<DashboardTeamLeaveResponse.TeamLeaveItem> items = events.stream()
            .map(DashboardTeamLeaveResponse.TeamLeaveItem::from)
            .toList();

        return ApiResponse.success(DashboardTeamLeaveResponse.builder().leaves(items).build());
    }
}
