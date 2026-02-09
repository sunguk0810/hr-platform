package com.hrsaas.attendance.service.impl;

import com.hrsaas.attendance.domain.AttendanceErrorCode;
import com.hrsaas.attendance.domain.dto.request.CheckInRequest;
import com.hrsaas.attendance.domain.dto.request.CheckOutRequest;
import com.hrsaas.attendance.domain.dto.request.UpdateAttendanceRecordRequest;
import com.hrsaas.attendance.domain.dto.response.AttendanceRecordResponse;
import com.hrsaas.attendance.domain.dto.response.AttendanceSummaryResponse;
import com.hrsaas.attendance.domain.dto.response.WorkHoursStatisticsResponse;
import com.hrsaas.attendance.domain.entity.AttendanceModificationLog;
import com.hrsaas.attendance.domain.entity.AttendanceRecord;
import com.hrsaas.attendance.domain.entity.AttendanceStatus;
import com.hrsaas.attendance.domain.entity.OvertimeRequest;
import com.hrsaas.attendance.domain.entity.OvertimeStatus;
import com.hrsaas.attendance.domain.entity.Holiday;
import com.hrsaas.attendance.repository.AttendanceModificationLogRepository;
import com.hrsaas.attendance.repository.AttendanceRecordRepository;
import com.hrsaas.attendance.repository.HolidayRepository;
import com.hrsaas.attendance.repository.OvertimeRequestRepository;
import com.hrsaas.attendance.service.AttendanceService;
import com.hrsaas.common.core.exception.BusinessException;
import com.hrsaas.common.core.exception.NotFoundException;
import com.hrsaas.common.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.YearMonth;
import java.time.temporal.WeekFields;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AttendanceServiceImpl implements AttendanceService {

    private final AttendanceRecordRepository attendanceRecordRepository;
    private final OvertimeRequestRepository overtimeRequestRepository;
    private final AttendanceModificationLogRepository modificationLogRepository;
    private final HolidayRepository holidayRepository;

    @Override
    @Transactional
    public AttendanceRecordResponse checkIn(CheckInRequest request, UUID employeeId) {
        UUID tenantId = TenantContext.getCurrentTenant();
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();

        // 이미 오늘 출근 기록이 있는지 확인
        attendanceRecordRepository.findByEmployeeIdAndWorkDate(tenantId, employeeId, today)
            .ifPresent(record -> {
                if (record.getCheckInTime() != null) {
                    throw new BusinessException(AttendanceErrorCode.ALREADY_CHECKED_IN, "이미 오늘 출근 처리가 되어 있습니다", HttpStatus.CONFLICT);
                }
            });

        // 새 출근 기록 생성 또는 기존 기록에 출근 시간 기록
        AttendanceRecord record = attendanceRecordRepository
            .findByEmployeeIdAndWorkDate(tenantId, employeeId, today)
            .orElseGet(() -> AttendanceRecord.builder()
                .employeeId(employeeId)
                .workDate(today)
                .build());

        record.checkIn(now, request.location());
        if (request.note() != null && !request.note().isBlank()) {
            record.setNote(request.note());
        }

        AttendanceRecord saved = attendanceRecordRepository.save(record);
        log.info("Check-in recorded: employeeId={}, time={}, location={}", employeeId, now, request.location());

        return AttendanceRecordResponse.from(saved);
    }

    @Override
    @Transactional
    public AttendanceRecordResponse checkOut(CheckOutRequest request, UUID employeeId) {
        UUID tenantId = TenantContext.getCurrentTenant();
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();

        AttendanceRecord record = attendanceRecordRepository
            .findByEmployeeIdAndWorkDate(tenantId, employeeId, today)
            .orElseThrow(() -> new NotFoundException(AttendanceErrorCode.NO_CHECK_IN_RECORD, "오늘 출근 기록이 없습니다. 먼저 출근 처리를 해주세요."));

        if (record.getCheckInTime() == null) {
            throw new BusinessException(AttendanceErrorCode.CHECK_IN_REQUIRED, "출근 처리 없이 퇴근할 수 없습니다", HttpStatus.BAD_REQUEST);
        }

        if (record.getCheckOutTime() != null) {
            throw new BusinessException(AttendanceErrorCode.ALREADY_CHECKED_OUT, "이미 퇴근 처리가 되어 있습니다", HttpStatus.CONFLICT);
        }

        record.checkOut(now, request.location());
        if (request.note() != null && !request.note().isBlank()) {
            String existingNote = record.getNote();
            String newNote = existingNote != null ? existingNote + " | " + request.note() : request.note();
            record.setNote(newNote);
        }

        AttendanceRecord saved = attendanceRecordRepository.save(record);
        log.info("Check-out recorded: employeeId={}, time={}, workHours={}", employeeId, now, saved.getWorkHours());

        return AttendanceRecordResponse.from(saved);
    }

    @Override
    public AttendanceRecordResponse getToday(UUID employeeId) {
        UUID tenantId = TenantContext.getCurrentTenant();
        LocalDate today = LocalDate.now();

        AttendanceRecord record = attendanceRecordRepository
            .findByEmployeeIdAndWorkDate(tenantId, employeeId, today)
            .orElse(null);

        if (record == null) {
            // 오늘 기록이 없으면 빈 응답 반환 (출퇴근 전 상태)
            return new AttendanceRecordResponse(
                null, employeeId, today, null, null,
                AttendanceStatus.NORMAL, 0, 0, 0, 0, null, null, null
            );
        }

        return AttendanceRecordResponse.from(record);
    }

    @Override
    public List<AttendanceRecordResponse> getMyAttendances(UUID employeeId, LocalDate startDate, LocalDate endDate) {
        UUID tenantId = TenantContext.getCurrentTenant();

        if (startDate.isAfter(endDate)) {
            throw new BusinessException(AttendanceErrorCode.INVALID_DATE_RANGE, "시작일이 종료일보다 늦을 수 없습니다", HttpStatus.BAD_REQUEST);
        }

        List<AttendanceRecord> records = attendanceRecordRepository
            .findByEmployeeIdAndDateRange(tenantId, employeeId, startDate, endDate);

        return records.stream()
            .map(AttendanceRecordResponse::from)
            .toList();
    }

    @Override
    public AttendanceSummaryResponse getMonthlySummary(UUID employeeId, int year, int month) {
        UUID tenantId = TenantContext.getCurrentTenant();

        YearMonth yearMonth = YearMonth.of(year, month);
        LocalDate startDate = yearMonth.atDay(1);
        LocalDate endDate = yearMonth.atEndOfMonth();

        List<AttendanceRecord> records = attendanceRecordRepository
            .findByEmployeeIdAndDateRange(tenantId, employeeId, startDate, endDate);

        int presentDays = (int) records.stream()
            .filter(r -> r.getCheckInTime() != null)
            .count();

        int lateDays = (int) records.stream()
            .filter(r -> r.getStatus() == AttendanceStatus.LATE)
            .count();

        int earlyLeaveDays = (int) records.stream()
            .filter(r -> r.getStatus() == AttendanceStatus.EARLY_LEAVE)
            .count();

        int totalOvertimeMinutes = records.stream()
            .mapToInt(r -> r.getOvertimeMinutes() != null ? r.getOvertimeMinutes() : 0)
            .sum();

        int totalWorkHours = records.stream()
            .mapToInt(r -> r.getWorkHours() != null ? r.getWorkHours() : 0)
            .sum();

        // 해당 월의 근무일수 계산 (주말 제외, 공휴일은 별도 처리 필요)
        int totalWorkDays = calculateWorkDays(yearMonth);

        return AttendanceSummaryResponse.of(
            year, month, totalWorkDays, presentDays,
            lateDays, earlyLeaveDays, totalOvertimeMinutes, totalWorkHours
        );
    }

    @Override
    public AttendanceRecordResponse getById(UUID id) {
        AttendanceRecord record = attendanceRecordRepository.findById(id)
            .orElseThrow(() -> new NotFoundException(AttendanceErrorCode.ATTENDANCE_NOT_FOUND, "근태 기록을 찾을 수 없습니다: " + id));

        return AttendanceRecordResponse.from(record);
    }

    @Override
    @Transactional
    public AttendanceRecordResponse updateRecord(UUID id, UpdateAttendanceRecordRequest request,
                                                  UUID adminId, String adminName) {
        UUID tenantId = TenantContext.getCurrentTenant();

        AttendanceRecord record = attendanceRecordRepository.findById(id)
            .orElseThrow(() -> new NotFoundException(AttendanceErrorCode.ATTENDANCE_NOT_FOUND,
                "근태 기록을 찾을 수 없습니다: " + id));

        List<AttendanceModificationLog> logs = new ArrayList<>();

        // checkInTime 변경 감지
        if (request.getCheckInTime() != null &&
            !Objects.equals(record.getCheckInTime(), request.getCheckInTime())) {
            logs.add(buildLog(tenantId, id, adminId, adminName, "checkInTime",
                String.valueOf(record.getCheckInTime()),
                String.valueOf(request.getCheckInTime()),
                request.getRemarks()));
            record.setCheckInTime(request.getCheckInTime());
        }

        // checkOutTime 변경 감지
        if (request.getCheckOutTime() != null &&
            !Objects.equals(record.getCheckOutTime(), request.getCheckOutTime())) {
            logs.add(buildLog(tenantId, id, adminId, adminName, "checkOutTime",
                String.valueOf(record.getCheckOutTime()),
                String.valueOf(request.getCheckOutTime()),
                request.getRemarks()));
            record.setCheckOutTime(request.getCheckOutTime());
        }

        // status 변경 감지
        if (request.getStatus() != null &&
            !Objects.equals(record.getStatus(), request.getStatus())) {
            logs.add(buildLog(tenantId, id, adminId, adminName, "status",
                String.valueOf(record.getStatus()),
                String.valueOf(request.getStatus()),
                request.getRemarks()));
            record.setStatus(request.getStatus());
        }

        if (logs.isEmpty()) {
            return AttendanceRecordResponse.from(record);
        }

        // 시간 관련 필드 재계산
        recalculateTimeFields(record);

        // 감사 로그 저장
        modificationLogRepository.saveAll(logs);
        AttendanceRecord saved = attendanceRecordRepository.save(record);

        log.info("Attendance record updated by admin: recordId={}, adminId={}, changes={}",
            id, adminId, logs.size());

        return AttendanceRecordResponse.from(saved);
    }

    private AttendanceModificationLog buildLog(UUID tenantId, UUID recordId, UUID adminId,
                                                String adminName, String fieldName,
                                                String oldValue, String newValue, String remarks) {
        return AttendanceModificationLog.builder()
            .tenantId(tenantId)
            .attendanceRecordId(recordId)
            .modifiedBy(adminId)
            .modifiedByName(adminName)
            .fieldName(fieldName)
            .oldValue(oldValue)
            .newValue(newValue)
            .remarks(remarks)
            .build();
    }

    private void recalculateTimeFields(AttendanceRecord record) {
        LocalTime standardStartTime = LocalTime.of(9, 0);
        LocalTime standardEndTime = LocalTime.of(18, 0);

        // lateMinutes 재계산
        if (record.getCheckInTime() != null && record.getCheckInTime().isAfter(standardStartTime)) {
            record.setLateMinutes((int) Duration.between(standardStartTime, record.getCheckInTime()).toMinutes());
            if (record.getStatus() == AttendanceStatus.NORMAL) {
                record.setStatus(AttendanceStatus.LATE);
            }
        } else {
            record.setLateMinutes(0);
        }

        // workHours 재계산
        if (record.getCheckInTime() != null && record.getCheckOutTime() != null) {
            long minutes = Duration.between(record.getCheckInTime(), record.getCheckOutTime()).toMinutes();
            minutes -= 60; // 점심시간 1시간 제외
            record.setWorkHours((int) (minutes / 60));
        }

        // earlyLeaveMinutes 재계산
        if (record.getCheckOutTime() != null && record.getCheckOutTime().isBefore(standardEndTime)) {
            record.setEarlyLeaveMinutes((int) Duration.between(record.getCheckOutTime(), standardEndTime).toMinutes());
        } else {
            record.setEarlyLeaveMinutes(0);
        }

        // overtimeMinutes 재계산
        if (record.getCheckOutTime() != null && record.getCheckOutTime().isAfter(standardEndTime)) {
            record.setOvertimeMinutes((int) Duration.between(standardEndTime, record.getCheckOutTime()).toMinutes());
        } else {
            record.setOvertimeMinutes(0);
        }
    }

    private int calculateWorkDays(YearMonth yearMonth) {
        UUID tenantId = TenantContext.getCurrentTenant();
        int workDays = 0;
        LocalDate date = yearMonth.atDay(1);
        LocalDate endDate = yearMonth.atEndOfMonth();

        while (!date.isAfter(endDate)) {
            java.time.DayOfWeek dayOfWeek = date.getDayOfWeek();
            if (dayOfWeek != java.time.DayOfWeek.SATURDAY && dayOfWeek != java.time.DayOfWeek.SUNDAY) {
                workDays++;
            }
            date = date.plusDays(1);
        }

        // 평일 공휴일 수 제외
        List<Holiday> holidays = holidayRepository.findByDateRange(tenantId, yearMonth.atDay(1), endDate);
        long weekdayHolidays = holidays.stream()
            .filter(h -> h.getHolidayDate().getDayOfWeek() != java.time.DayOfWeek.SATURDAY
                      && h.getHolidayDate().getDayOfWeek() != java.time.DayOfWeek.SUNDAY)
            .count();
        workDays -= (int) weekdayHolidays;

        return workDays;
    }

    @Override
    public WorkHoursStatisticsResponse getWorkHoursStatistics(String weekPeriod, UUID departmentId, String status) {
        UUID tenantId = TenantContext.getCurrentTenant();

        // Parse ISO week period or use current week
        LocalDate weekStart;
        LocalDate weekEnd;
        String period;

        if (weekPeriod != null && weekPeriod.matches("\\d{4}-W\\d{2}")) {
            String[] parts = weekPeriod.split("-W");
            int year = Integer.parseInt(parts[0]);
            int week = Integer.parseInt(parts[1]);

            WeekFields weekFields = WeekFields.ISO;
            LocalDate jan4 = LocalDate.of(year, 1, 4);
            int dayOfWeek = jan4.getDayOfWeek().getValue();
            weekStart = jan4.minusDays(dayOfWeek - 1).plusWeeks(week - 1);
            weekEnd = weekStart.plusDays(6);
            period = weekPeriod;
        } else {
            LocalDate now = LocalDate.now();
            WeekFields weekFields = WeekFields.ISO;
            weekStart = now.with(weekFields.dayOfWeek(), 1); // Monday
            weekEnd = weekStart.plusDays(6); // Sunday
            period = String.format("%d-W%02d", now.get(weekFields.weekBasedYear()), now.get(weekFields.weekOfWeekBasedYear()));
        }

        log.debug("Fetching work hours statistics for tenant: {}, period: {}, weekStart: {}, weekEnd: {}",
            tenantId, period, weekStart, weekEnd);

        // Query real data from database
        List<WorkHoursStatisticsResponse.EmployeeWorkHoursResponse> employees =
            queryWorkHoursFromDatabase(tenantId, weekStart, weekEnd, departmentId);

        // Apply status filter if provided
        List<WorkHoursStatisticsResponse.EmployeeWorkHoursResponse> filteredEmployees = employees;
        if (status != null && !status.isBlank()) {
            filteredEmployees = employees.stream()
                .filter(e -> e.getStatus().equalsIgnoreCase(status))
                .toList();
        }

        // Calculate summary
        int normalCount = (int) filteredEmployees.stream()
            .filter(e -> "NORMAL".equals(e.getStatus()))
            .count();
        int warningCount = (int) filteredEmployees.stream()
            .filter(e -> "WARNING".equals(e.getStatus()))
            .count();
        int exceededCount = (int) filteredEmployees.stream()
            .filter(e -> "EXCEEDED".equals(e.getStatus()))
            .count();

        WorkHoursStatisticsResponse.WorkHoursSummaryResponse summary =
            WorkHoursStatisticsResponse.WorkHoursSummaryResponse.builder()
                .totalEmployees(filteredEmployees.size())
                .normalCount(normalCount)
                .warningCount(warningCount)
                .exceededCount(exceededCount)
                .build();

        log.info("Work hours statistics: period={}, total={}, normal={}, warning={}, exceeded={}",
            period, filteredEmployees.size(), normalCount, warningCount, exceededCount);

        return WorkHoursStatisticsResponse.builder()
            .period(period)
            .weekStartDate(weekStart)
            .weekEndDate(weekEnd)
            .employees(filteredEmployees)
            .summary(summary)
            .build();
    }

    /**
     * Query work hours data from database
     * Aggregates attendance records and approved overtime requests
     */
    private List<WorkHoursStatisticsResponse.EmployeeWorkHoursResponse> queryWorkHoursFromDatabase(
            UUID tenantId, LocalDate weekStart, LocalDate weekEnd, UUID departmentIdFilter) {

        // 1. Get all attendance records for the week
        List<AttendanceRecord> attendanceRecords =
            attendanceRecordRepository.findByTenantIdAndDateRange(tenantId, weekStart, weekEnd);

        // 2. Get all approved/completed overtime requests for the week
        List<OvertimeRequest> overtimeRequests =
            overtimeRequestRepository.findByDateRange(tenantId, weekStart, weekEnd).stream()
                .filter(o -> o.getStatus() == OvertimeStatus.APPROVED || o.getStatus() == OvertimeStatus.COMPLETED)
                .toList();

        // 3. Build a map of overtime info by employee (for employee name and department)
        Map<UUID, OvertimeRequest> employeeOvertimeInfo = new HashMap<>();
        Map<UUID, Double> employeeOvertimeHours = new HashMap<>();

        for (OvertimeRequest ot : overtimeRequests) {
            employeeOvertimeInfo.putIfAbsent(ot.getEmployeeId(), ot);
            double hours = ot.getActualHours() != null
                ? ot.getActualHours().doubleValue()
                : ot.getPlannedHours().doubleValue();
            employeeOvertimeHours.merge(ot.getEmployeeId(), hours, Double::sum);
        }

        // 4. Aggregate attendance by employee
        Map<UUID, Double> employeeRegularHours = new HashMap<>();
        Map<UUID, Integer> employeeOvertimeMinutesFromAttendance = new HashMap<>();

        for (AttendanceRecord record : attendanceRecords) {
            UUID empId = record.getEmployeeId();
            double workHours = record.getWorkHours() != null ? record.getWorkHours() : 0;
            int overtimeMinutes = record.getOvertimeMinutes() != null ? record.getOvertimeMinutes() : 0;

            // Regular hours are capped at 8 per day
            double regularHours = Math.min(workHours, 8.0);
            employeeRegularHours.merge(empId, regularHours, Double::sum);
            employeeOvertimeMinutesFromAttendance.merge(empId, overtimeMinutes, Integer::sum);
        }

        // 5. Build the response list
        List<WorkHoursStatisticsResponse.EmployeeWorkHoursResponse> result = new ArrayList<>();

        // Combine all employee IDs
        java.util.Set<UUID> allEmployeeIds = new java.util.HashSet<>();
        allEmployeeIds.addAll(employeeRegularHours.keySet());
        allEmployeeIds.addAll(employeeOvertimeHours.keySet());

        for (UUID employeeId : allEmployeeIds) {
            double regularHours = employeeRegularHours.getOrDefault(employeeId, 0.0);

            // Overtime: use approved OT request hours, or attendance overtime minutes as fallback
            double overtimeHours = employeeOvertimeHours.getOrDefault(employeeId, 0.0);
            if (overtimeHours == 0 && employeeOvertimeMinutesFromAttendance.containsKey(employeeId)) {
                overtimeHours = employeeOvertimeMinutesFromAttendance.get(employeeId) / 60.0;
            }

            double totalHours = regularHours + overtimeHours;
            double exceededHours = Math.max(0, totalHours - 52);

            // Get employee info from overtime request if available
            OvertimeRequest otInfo = employeeOvertimeInfo.get(employeeId);
            String employeeName = otInfo != null ? otInfo.getEmployeeName() : "직원-" + employeeId.toString().substring(0, 8);
            String departmentName = otInfo != null ? otInfo.getDepartmentName() : "미지정";
            String departmentIdStr = otInfo != null && otInfo.getDepartmentId() != null
                ? otInfo.getDepartmentId().toString() : null;

            // Apply department filter
            if (departmentIdFilter != null && departmentIdStr != null
                && !departmentIdStr.equals(departmentIdFilter.toString())) {
                continue;
            }

            result.add(WorkHoursStatisticsResponse.EmployeeWorkHoursResponse.builder()
                .employeeId(employeeId.toString())
                .employeeName(employeeName)
                .department(departmentName)
                .departmentId(departmentIdStr)
                .regularHours(Math.round(regularHours * 10) / 10.0)
                .overtimeHours(Math.round(overtimeHours * 10) / 10.0)
                .totalHours(Math.round(totalHours * 10) / 10.0)
                .status(WorkHoursStatisticsResponse.determineStatus(totalHours))
                .exceededHours(Math.round(exceededHours * 10) / 10.0)
                .build());
        }

        // Sort by total hours descending (show exceeded first)
        result.sort((a, b) -> Double.compare(b.getTotalHours(), a.getTotalHours()));

        return result;
    }
}
